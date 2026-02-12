import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = params.id;

    // Verify organization exists and user has access
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true }
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    console.log(`Starting Excel export for organization: ${organization.name}`);

    // 1️⃣ Organization Objectives (where projectId and programId are null)
    const organizationObjectives = await prisma.objective.findMany({
      where: {
        organizationId,
        projectId: null,
        programId: null
      },
      select: {
        code: true,
        level: true,
        description: true,
        orderIndex: true,
        createdAt: true
      },
      orderBy: { orderIndex: 'asc' }
    });

    // 2️⃣ Organization Indicators (with reference to org objectives)
    const organizationIndicators = await prisma.indicator.findMany({
      where: {
        organizationId,
        projectId: null,
        programId: null
      },
      include: {
        objective: {
          select: {
            code: true,
            description: true
          }
        }
      }
    });

    // 3️⃣ Donors
    const donors = await prisma.donor.findMany({
      where: { organizationId },
      select: {
        name: true,
        type: true,
        code: true,
        description: true,
        createdAt: true
      }
    });

    // 4️⃣ Intervention Coverage (Locations)
    const states = await prisma.state.findMany({
      where: { organizationId },
      include: {
        district: {
          include: {
            block: {
              include: {
                grampanchaya: {
                  include: {
                    village: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // 5️⃣ Programs
    const programs = await prisma.program.findMany({
      where: { organizationId },
      select: {
        name: true,
        description: true,
        theme: true,
        sector: true,
        status: true,
        priority: true,
        budget: true,
        startDate: true,
        endDate: true,
        createdAt: true
      }
    });

    // 6️⃣ Program Objectives
    const programObjectives = await prisma.objective.findMany({
      where: {
        organizationId,
        programId: { not: null }
      },
      include: {
        program: {
          select: {
            name: true
          }
        }
      },
      orderBy: { orderIndex: 'asc' }
    });

    // 7️⃣ Program Indicators
    const programIndicators = await prisma.indicator.findMany({
      where: {
        organizationId,
        programId: { not: null }
      },
      include: {
        program: {
          select: {
            name: true
          }
        },
        objective: {
          select: {
            code: true,
            description: true
          }
        }
      }
    });

    // 8️⃣ Program Interventions
    const programInterventions = await prisma.intervention.findMany({
      where: {
        programs: {
          some: {
            organizationId
          }
        }
      },
      include: {
        programs: {
          where: { organizationId },
          select: {
            name: true
          }
        },
        objective: {
          select: {
            code: true,
            description: true
          }
        },
        SubIntervention: {
          select: {
            name: true,
            description: true
          }
        }
      }
    });

    // 9️⃣ Projects
    const projects = await prisma.project.findMany({
      where: { organizationId },
      include: {
        programs: {
          select: {
            name: true
          }
        }
      }
    });

    // 🔟 Project Activities
    const projectActivities = await prisma.activity.findMany({
      where: {
        organizationId,
        projectId: { not: null }
      },
      include: {
        project: {
          select: {
            name: true,
            code: true
          }
        },
        objective: {
          select: {
            code: true,
            description: true
          }
        },
        indicator: {
          select: {
            name: true
          }
        },
        Intervention: {
          select: {
            name: true
          }
        },
        subInterventionRel: {
          select: {
            name: true
          }
        }
      }
    });

    // 1️⃣1️⃣ Project Plans
    const projectPlans = await prisma.plan.findMany({
      where: {
        project: {
          organizationId
        }
      },
      include: {
        project: {
          select: {
            name: true,
            code: true
          }
        },
        activity: {
          select: {
            name: true,
            code: true
          }
        },
        interventionArea: {
          select: {
            location: true,
            state: {
              select: { name: true }
            },
            district: {
              select: { name: true }
            }
          }
        }
      }
    });

    // 1️⃣2️⃣ Reports
    const reports = await prisma.report.findMany({
      where: { organizationId },
      include: {
        project: {
          select: {
            name: true,
            code: true
          }
        },
        program: {
          select: {
            name: true
          }
        },
        activity: {
          select: {
            name: true,
            code: true
          }
        },
        creator: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        interventionArea: {
          select: {
            location: true,
            state: {
              select: { name: true }
            },
            district: {
              select: { name: true }
            }
          }
        }
      }
    });

    // Create Excel workbook with multiple sheets
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Organization Objectives
    const orgObjectivesData = organizationObjectives.map(obj => ({
      'Objective Code': obj.code || 'N/A',
      'Level': obj.level,
      'Description': obj.description,
      'Order Index': obj.orderIndex,
      'Created Date': obj.createdAt.toISOString().split('T')[0]
    }));
    const orgObjectivesSheet = XLSX.utils.json_to_sheet(orgObjectivesData);
    XLSX.utils.book_append_sheet(workbook, orgObjectivesSheet, 'Organization Objectives');

    // Sheet 2: Organization Indicators
    const orgIndicatorsData = organizationIndicators.map(ind => ({
      'Indicator Name': ind.name,
      'Type': ind.type,
      'Level': ind.level,
      'Definition': ind.definition,
      'Data Source': ind.dataSource,
      'Frequency': ind.frequency,
      'Unit of Measure': ind.unitOfMeasure,
      'Related Objective Code': ind.objective?.code || 'N/A',
      'Related Objective Description': ind.objective?.description || 'N/A',
      'Baseline Value': ind.baselineValue || 'N/A',
      'Target': ind.target || 'N/A',
      'Created Date': ind.createdAt.toISOString().split('T')[0]
    }));
    const orgIndicatorsSheet = XLSX.utils.json_to_sheet(orgIndicatorsData);
    XLSX.utils.book_append_sheet(workbook, orgIndicatorsSheet, 'Organization Indicators');

    // Sheet 3: Donors
    const donorsData = donors.map(donor => ({
      'Donor Name': donor.name,
      'Type': donor.type,
      'Code': donor.code || 'N/A',
      'Description': donor.description || 'N/A',
      'Created Date': donor.createdAt.toISOString().split('T')[0]
    }));
    const donorsSheet = XLSX.utils.json_to_sheet(donorsData);
    XLSX.utils.book_append_sheet(workbook, donorsSheet, 'Donors');

    // Sheet 4: Intervention Coverage (Locations)
    const locationsData: any[] = [];
    states.forEach(state => {
      state.district.forEach(district => {
        district.block.forEach(block => {
          block.grampanchaya.forEach(gp => {
            gp.village.forEach(village => {
              locationsData.push({
                'State': state.name,
                'District': district.name,
                'Block': block.name,
                'Gram Panchayat': gp.name,
                'Village': village.name,
                'Area Type': block.areaType
              });
            });
            // Also add GP without villages if no villages exist
            if (gp.village.length === 0) {
              locationsData.push({
                'State': state.name,
                'District': district.name,
                'Block': block.name,
                'Gram Panchayat': gp.name,
                'Village': 'N/A',
                'Area Type': block.areaType
              });
            }
          });
          // Also add blocks without GPs if no GPs exist
          if (block.grampanchaya.length === 0) {
            locationsData.push({
              'State': state.name,
              'District': district.name,
              'Block': block.name,
              'Gram Panchayat': 'N/A',
              'Village': 'N/A',
              'Area Type': block.areaType
            });
          }
        });
      });
    });
    const locationsSheet = XLSX.utils.json_to_sheet(locationsData);
    XLSX.utils.book_append_sheet(workbook, locationsSheet, 'Intervention Coverage');

    // Sheet 5: Programs
    const programsData = programs.map(prog => ({
      'Program Name': prog.name,
      'Description': prog.description || 'N/A',
      'Theme': prog.theme || 'N/A',
      'Sector': prog.sector || 'N/A',
      'Status': prog.status,
      'Priority': prog.priority,
      'Budget (INR)': prog.budget ? Number(prog.budget) : 'N/A',
      'Start Date': prog.startDate ? prog.startDate.toISOString().split('T')[0] : 'N/A',
      'End Date': prog.endDate ? prog.endDate.toISOString().split('T')[0] : 'N/A',
      'Created Date': prog.createdAt.toISOString().split('T')[0]
    }));
    const programsSheet = XLSX.utils.json_to_sheet(programsData);
    XLSX.utils.book_append_sheet(workbook, programsSheet, 'Programs');

    // Sheet 6: Program Objectives
    const progObjectivesData = programObjectives.map(obj => ({
      'Program Name': obj.program?.name || 'N/A',
      'Objective Code': obj.code || 'N/A',
      'Level': obj.level,
      'Description': obj.description,
      'Order Index': obj.orderIndex,
      'Created Date': obj.createdAt.toISOString().split('T')[0]
    }));
    const progObjectivesSheet = XLSX.utils.json_to_sheet(progObjectivesData);
    XLSX.utils.book_append_sheet(workbook, progObjectivesSheet, 'Program Objectives');

    // Sheet 7: Program Indicators
    const progIndicatorsData = programIndicators.map(ind => ({
      'Program Name': ind.program?.name || 'N/A',
      'Indicator Name': ind.name,
      'Type': ind.type,
      'Level': ind.level,
      'Definition': ind.definition,
      'Data Source': ind.dataSource,
      'Frequency': ind.frequency,
      'Unit of Measure': ind.unitOfMeasure,
      'Related Objective Code': ind.objective?.code || 'N/A',
      'Related Objective Description': ind.objective?.description || 'N/A',
      'Baseline Value': ind.baselineValue || 'N/A',
      'Target': ind.target || 'N/A',
      'Created Date': ind.createdAt.toISOString().split('T')[0]
    }));
    const progIndicatorsSheet = XLSX.utils.json_to_sheet(progIndicatorsData);
    XLSX.utils.book_append_sheet(workbook, progIndicatorsSheet, 'Program Indicators');

    // Sheet 8: Program Interventions
    const interventionsData: any[] = [];
    programInterventions.forEach(intervention => {
      intervention.programs.forEach(program => {
        intervention.SubIntervention.forEach(subInt => {
          interventionsData.push({
            'Program Name': program.name,
            'Intervention Name': intervention.name,
            'Intervention Description': intervention.description || 'N/A',
            'Activity Type': intervention.activityType || 'N/A',
            'Related Objective Code': intervention.objective?.code || 'N/A',
            'Sub-Intervention Name': subInt.name,
            'Sub-Intervention Description': subInt.description || 'N/A'
          });
        });
        // If no sub-interventions, still show the main intervention
        if (intervention.SubIntervention.length === 0) {
          interventionsData.push({
            'Program Name': program.name,
            'Intervention Name': intervention.name,
            'Intervention Description': intervention.description || 'N/A',
            'Activity Type': intervention.activityType || 'N/A',
            'Related Objective Code': intervention.objective?.code || 'N/A',
            'Sub-Intervention Name': 'N/A',
            'Sub-Intervention Description': 'N/A'
          });
        }
      });
    });
    const interventionsSheet = XLSX.utils.json_to_sheet(interventionsData);
    XLSX.utils.book_append_sheet(workbook, interventionsSheet, 'Program Interventions');

    // Sheet 9: Projects
    const projectsData = projects.map(proj => ({
      'Project Name': proj.name,
      'Project Code': proj.code || 'N/A',
      'Description': proj.description || 'N/A',
      'Theme': proj.theme || 'N/A',
      'Status': proj.status,
      'Budget (INR)': proj.totalBudget ? Number(proj.totalBudget) : 'N/A',
      'Currency': proj.currency,
      'Start Date': proj.startDate.toISOString().split('T')[0],
      'End Date': proj.endDate.toISOString().split('T')[0],
      'Direct Beneficiaries': proj.directBeneficiaries || 'N/A',
      'Indirect Beneficiaries': proj.indirectBeneficiaries || 'N/A',
      'Goal': proj.goal || 'N/A',
      'Associated Programs': proj.programs.map(p => p.name).join(', ') || 'N/A',
      'Created Date': proj.createdAt.toISOString().split('T')[0]
    }));
    const projectsSheet = XLSX.utils.json_to_sheet(projectsData);
    XLSX.utils.book_append_sheet(workbook, projectsSheet, 'Projects');

    // Sheet 10: Project Activities
    const activitiesData = projectActivities.map(act => ({
      'Project Name': act.project?.name || 'N/A',
      'Project Code': act.project?.code || 'N/A',
      'Activity Name': act.name,
      'Activity Code': act.code || 'N/A',
      'Description': act.description || 'N/A',
      'Type': act.type,
      'Status': act.status,
      'Start Date': act.startDate ? act.startDate.toISOString().split('T')[0] : 'N/A',
      'End Date': act.endDate ? act.endDate.toISOString().split('T')[0] : 'N/A',
      'Unit of Measure': act.unitOfMeasure || 'N/A',
      'Target Unit': act.targetUnit || 'N/A',
      'Cost per Unit': act.costPerUnit ? Number(act.costPerUnit) : 'N/A',
      'Total Budget': act.totalBudget ? Number(act.totalBudget) : 'N/A',
      'Related Objective Code': act.objective?.code || 'N/A',
      'Related Indicator': act.indicator?.name || 'N/A',
      'Intervention': act.Intervention?.name || 'N/A',
      'Sub-Intervention': act.subInterventionRel?.name || 'N/A',
      'Created Date': act.createdAt.toISOString().split('T')[0]
    }));
    const activitiesSheet = XLSX.utils.json_to_sheet(activitiesData);
    XLSX.utils.book_append_sheet(workbook, activitiesSheet, 'Project Activities');

    // Sheet 11: Project Plans
    const plansData = projectPlans.map(plan => ({
      'Project Name': plan.project?.name || 'N/A',
      'Project Code': plan.project?.code || 'N/A',
      'Activity Name': plan.activity?.name || 'N/A',
      'Activity Code': plan.activity?.code || 'N/A',
      'Start Month': plan.startMonth.toISOString().split('T')[0],
      'End Month': plan.endMonth.toISOString().split('T')[0],
      'Status': plan.status,
      'Location': plan.location || plan.interventionArea?.location || 'N/A',
      'State': plan.interventionArea?.state?.name || 'N/A',
      'District': plan.interventionArea?.district?.name || 'N/A',
      'Monthly Targets': JSON.stringify(plan.monthlyTargets || {}),
      'Created Date': plan.createdAt.toISOString().split('T')[0]
    }));
    const plansSheet = XLSX.utils.json_to_sheet(plansData);
    XLSX.utils.book_append_sheet(workbook, plansSheet, 'Project Plans');

    // Sheet 12: Reports
    const reportsData = reports.map(rep => ({
      'Report Title': rep.title || 'N/A',
      'Type': rep.type || 'N/A',
      'Status': rep.status,
      'Project Name': rep.project?.name || 'N/A',
      'Project Code': rep.project?.code || 'N/A',
      'Program Name': rep.program?.name || 'N/A',
      'Activity Name': rep.activity?.name || 'N/A',
      'Activity Code': rep.activity?.code || 'N/A',
      'Reporting Date': rep.reportingDate.toISOString().split('T')[0],
      'Reporting Month': rep.reportingMonth,
      'Reporting Quarter': rep.reportingQuarter,
      'Reporting Year': rep.reportingYear,
      'Level of Activity': rep.levelofActivity,
      'Location': rep.interventionArea?.location || 'N/A',
      'State': rep.interventionArea?.state?.name || 'N/A',
      'District': rep.interventionArea?.district?.name || 'N/A',
      'Unit Type': rep.unitType || 'N/A',
      'Unit Reported': rep.unitReported || 'N/A',
      'Number of People': rep.numberOfPeople || 'N/A',
      'Created By': rep.creator ? `${rep.creator.firstName} ${rep.creator.lastName}` : 'N/A',
      'Created Date': rep.createdAt.toISOString().split('T')[0]
    }));
    const reportsSheet = XLSX.utils.json_to_sheet(reportsData);
    XLSX.utils.book_append_sheet(workbook, reportsSheet, 'Reports');

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'buffer'
    });

    // Create filename with organization name and date
    const fileName = `${organization.name.replace(/[^a-zA-Z0-9]/g, '_')}_Export_${new Date().toISOString().split('T')[0]}.xlsx`;

    console.log(`Excel export completed for organization: ${organization.name}`);

    // Return the Excel file
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': excelBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error("Excel export error:", error);
    return NextResponse.json(
      { error: "Failed to export organization data", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}