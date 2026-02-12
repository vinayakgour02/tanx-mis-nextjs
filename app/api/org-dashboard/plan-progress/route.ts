import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";

// GET /api/org-dashboard/plan-progress - Get plan vs progress data
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const organizationId = session.user.organizationId;
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const interventionAreaId = searchParams.get('interventionAreaId');
    const projectId = searchParams.get('projectId');
    const donorId = searchParams.get('donorId');
    const programId = searchParams.get('programId');
    const objectiveId = searchParams.get('objectiveId');
    const ragRating = searchParams.get('ragRating');

    // Get current financial year in the format used in the database (e.g., "FY24")
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Financial year starts from April (month 3)
    // If current month is Jan-Mar, we're in the previous financial year
    let currentFinancialYear;
    if (currentMonth >= 3) {
      currentFinancialYear = `FY${(currentYear % 100).toString().padStart(2, '0')}`;
    } else {
      currentFinancialYear = `FY${((currentYear - 1) % 100).toString().padStart(2, '0')}`;
    }

    // Build where clause for activities
    const activityWhere: any = {
      organizationId,
      projectId: { not: null },
      subInterventionId: { not: null },
    };

    // Apply filters if provided
    if (projectId) {
      activityWhere.projectId = projectId;
    }
    
    // If programId is provided but no projectId, get all projects under the program
    let programProjectIds: string[] | null = null;
    if (programId && !projectId) {
      const programProjects = await prisma.project.findMany({
        where: {
          organizationId,
          programs: {
            some: {
              id: programId
            }
          }
        },
        select: {
          id: true
        }
      });
      
      programProjectIds = programProjects.map(project => project.id);
      activityWhere.projectId = { in: programProjectIds };
    }
    
    if (programId && projectId) {
      // When both program and project are selected, ensure activity belongs to the project
      // The program filter is handled through the project's program relationship
      activityWhere.projectId = projectId;
    }

    
    if (objectiveId) {
      activityWhere.objectiveId = objectiveId;
    }

    // Add intervention area filter if provided
    if (interventionAreaId) {
      // We need to filter activities that have plans with the specified intervention area
      activityWhere.Plan = {
        some: {
          interventionAreaId: interventionAreaId
        }
      };
    }


    // Get all activities with their subinterventions, projects, and targets
    const activities = await prisma.activity.findMany({
      where: activityWhere,
      include: {
        subInterventionRel: {
          select: {
            id: true,
            name: true,
          }
        },
        project: {
          include: {
            funding: {
              include: {
                donor: {
                  select: {
                    id: true,
                    name: true,
                  }
                }
              }
            }
          }
        },
        programs: {
          select: {
            id: true,
            name: true,
          }
        },
        objective: {
          select: {
            id: true,
            description: true,
          }
        },
        reports: {
          where: {
            reportingYear: currentFinancialYear,
          },
          select: {
            unitReported: true,
          }
        },
        Plan: {
          select: {
            monthlyTargets: true,
            startMonth: true,
            endMonth: true,
            interventionArea: {
              select: {
                id: true,
                stateId: true,
                districtId: true,
                blockId: true,
                gramPanchayatId: true,
                villageId: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate YTD progress and RAG rating for each activity
    const planVsProgressData = activities.map(activity => {
      // Sum up all reported units for this activity
      const ytdProgress = activity.reports.reduce((sum: number, report: { unitReported: number | null }) => {
        return sum + (report.unitReported || 0);
      }, 0);
      
      // Calculate life of project target by summing all monthly targets from all plans
      let lifeOfProjectTarget = 0;
      activity.Plan.forEach(plan => {
        if (plan.monthlyTargets) {
          try {
            const targets = JSON.parse(JSON.stringify(plan.monthlyTargets));
            if (typeof targets === 'object' && targets !== null) {
              Object.values(targets).forEach(target => {
                if (typeof target === 'number') {
                  lifeOfProjectTarget += target;
                }
              });
            }
          } catch (e) {
            console.error('Error parsing monthly targets:', e);
          }
        }
      });
      
      // If no plan targets found, fall back to activity targetUnit
      if (lifeOfProjectTarget === 0 && activity.targetUnit) {
        lifeOfProjectTarget = activity.targetUnit;
      }
      
      // Annual target is the activity's targetUnit
      const annualTarget = activity.targetUnit || 0;
      
      // Calculate YTD plan based on current date
      let ytdPlan = 0;
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1; // 1-12
      
      activity.Plan.forEach(plan => {
        if (plan.monthlyTargets) {
          try {
            const targets = JSON.parse(JSON.stringify(plan.monthlyTargets));
            if (typeof targets === 'object' && targets !== null) {
              // Sum targets for months up to current month
              Object.keys(targets).forEach(monthKey => {
                // Parse the month key (e.g., "2025-09")
                const [yearStr, monthStr] = monthKey.split('-');
                const year = parseInt(yearStr);
                const month = parseInt(monthStr);
                
                // Check if month is in the past or current year/month
                if (year < currentYear || (year === currentYear && month <= currentMonth)) {
                  const target = targets[monthKey];
                  if (typeof target === 'number') {
                    ytdPlan += target;
                  }
                }
              });
            }
          } catch (e) {
            console.error('Error parsing monthly targets for YTD plan:', e);
          }
        }
      });
      
      let ragRating = 'gray'; // Default for no target or no progress
      
      // Calculate RAG rating based on life of project target
      if (lifeOfProjectTarget > 0) {
        const progressPercentage = (ytdProgress / lifeOfProjectTarget) * 100;
        if (progressPercentage >= 75) {
          ragRating = 'green';
        } else if (progressPercentage <= 25) {
          ragRating = 'red';
        } else {
          ragRating = 'amber';
        }
      }

      // Get donor information
      const donors = activity.project?.funding.map(fund => ({
        id: fund.donor.id,
        name: fund.donor.name
      })) || [];

      return {
        id: activity.id,
        subInterventionName: activity.subInterventionRel?.name || 'N/A',
        activityName: activity.name,
        projectName: activity.project?.name || 'N/A',
        lifeOfProjectTarget,
        annualTarget,
        ytdPlan,
        unitOfMeasure: activity.unitOfMeasure || '',
        ytdProgress,
        ragRating,
        program: activity.programs[0] || null, // Assuming first program for simplicity
        objective: activity.objective || null,
        donors,
      };
    });

    // Apply donor filter if provided
    let filteredData = planVsProgressData;
    if (donorId) {
      filteredData = planVsProgressData.filter(item => 
        item.donors.some(donor => donor.id === donorId)
      );
    }

    // Apply RAG rating filter if provided
    if (ragRating) {
      filteredData = filteredData.filter(item => item.ragRating === ragRating);
    }

    return NextResponse.json(filteredData);
  } catch (error) {
    console.error('[PLAN_PROGRESS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}