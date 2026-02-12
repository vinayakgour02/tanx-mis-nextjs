import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // const session = await getServerSession(authOptions);
    
    // if (!session?.user) {
    //   return new NextResponse("Unauthorized", { status: 401 });
    // }

    const { id: organizationId } = await params;

    // Check if the user has permission to perform this action
    // const membership = await prisma.membership.findFirst({
    //   where: {
    //     userId: session.user.id,
    //     organizationId: organizationId,
    //     isActive: true,
    //     OR: [
    //       { appRole: "super_admin" },
    //       { ngoRole: "ngo_admin" }
    //     ]
    //   }
    // });

    // if (!membership) {
    //   return new NextResponse("Forbidden - Admin access required", { status: 403 });
    // }

    // Verify organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    });

    if (!organization) {
      return new NextResponse("Organization not found", { status: 404 });
    }

    // Start transaction to delete all data except organization profile with extended timeout
    const result = await prisma.$transaction(async (tx) => {
      console.log(`Starting cleanup for organization ${organizationId}`);
      const startTime = Date.now();
      
      // Delete in reverse dependency order to avoid foreign key constraints
      
      // 1. Delete audit logs
      console.log('Deleting audit logs...');
      const auditLogsDeleted = await tx.auditLog.deleteMany({
        where: { organizationId }
      });

      // 2. Delete notifications and user sessions in batch
      console.log('Deleting user-related data...');
      const userIds = await tx.membership.findMany({
        where: { organizationId },
        select: { userId: true }
      });
      const userIdList = userIds.map(u => u.userId);
      
      const [notificationsDeleted, userSessionsDeleted] = await Promise.all([
        tx.notification.deleteMany({
          where: { userId: { in: userIdList } }
        }),
        tx.userSession.deleteMany({
          where: { userId: { in: userIdList } }
        })
      ]);

      // 3. Delete attachments
      console.log('Deleting attachments...');
      const attachmentsDeleted = await tx.attachment.deleteMany({
        where: {
          OR: [
            { project: { organizationId } },
            { activity: { organizationId } },
            { task: { project: { organizationId } } },
            { report: { organizationId } }
          ]
        }
      });

      // 4. Delete report-related data in batch
      console.log('Deleting report-related data...');
      const [
        trainingParticipantsDeleted,
        trainingReportsDeleted,
        benefitReportsDeleted,
        householdReportsDeleted,
        infrastructureReportsDeleted
      ] = await Promise.all([
        tx.trainingParticipant.deleteMany({
          where: {
            trainingReport: {
              report: { organizationId }
            }
          }
        }),
        tx.trainingReport.deleteMany({
          where: {
            report: { organizationId }
          }
        }),
        tx.benefitReport.deleteMany({
          where: {
            beneficiary: {
              report: { organizationId }
            }
          }
        }),
        tx.householdReport.deleteMany({
          where: {
            report: { organizationId }
          }
        }),
        tx.infrastructureReport.deleteMany({
          where: {
            report: { organizationId }
          }
        })
      ]);

      // 5. Delete reports and plans
      console.log('Deleting reports and plans...');
      const [reportsDeleted, plansDeleted, tasksDeleted] = await Promise.all([
        tx.report.deleteMany({
          where: { organizationId }
        }),
        tx.plan.deleteMany({
          where: {
            project: { organizationId }
          }
        }),
        tx.task.deleteMany({
          where: {
            project: { organizationId }
          }
        })
      ]);

      // 6. Delete indicator measurements
      console.log('Deleting indicator measurements...');
      const indicatorMeasurementsDeleted = await tx.indicatorMeasurement.deleteMany({
        where: {
          indicator: { organizationId }
        }
      });

      // 7. Delete indicators (handle hierarchy - children first, then parents)
      console.log('Deleting indicators with hierarchy handling...');
      // First, find all indicators for this organization
      const allIndicators = await tx.indicator.findMany({
        where: { organizationId },
        select: { id: true, parentIndicatorId: true }
      });
      
      console.log(`Found ${allIndicators.length} indicators to delete for organization ${organizationId}`);
      
      // Delete child indicators first (those with parentIndicatorId)
      const childIndicators = allIndicators.filter(ind => ind.parentIndicatorId !== null);
      const childIndicatorsDeleted = await tx.indicator.deleteMany({
        where: {
          organizationId,
          parentIndicatorId: { not: null }
        }
      });
      
      console.log(`Deleted ${childIndicatorsDeleted.count} child indicators`);
      
      // Then delete parent indicators (those without parentIndicatorId)
      const parentIndicatorsDeleted = await tx.indicator.deleteMany({
        where: {
          organizationId,
          parentIndicatorId: null
        }
      });
      
      console.log(`Deleted ${parentIndicatorsDeleted.count} parent indicators`);
      
      const indicatorsDeleted = {
        count: childIndicatorsDeleted.count + parentIndicatorsDeleted.count
      };

      // 8. Delete organization indicators and activities
      console.log('Deleting organization indicators and activities...');
      const [orgIndicatorsDeleted, activitiesDeleted] = await Promise.all([
        tx.organizationIndicator.deleteMany({
          where: { organizationId }
        }),
        tx.activity.deleteMany({
          where: { organizationId }
        })
      ]);

      // 9. Delete interventions and sub-interventions
      console.log('Deleting interventions and sub-interventions...');
      const [subInterventionsDeleted, interventionsDeleted] = await Promise.all([
        tx.subIntervention.deleteMany({
          where: {
            intervention: {
              programs: {
                some: { organizationId }
              }
            }
          }
        }),
        tx.intervention.deleteMany({
          where: {
            programs: {
              some: { organizationId }
            }
          }
        })
      ]);

      // 10. Delete objectives and intervention areas
      console.log('Deleting objectives and intervention areas...');
      const [objectivesDeleted, interventionAreasDeleted] = await Promise.all([
        tx.objective.deleteMany({
          where: { organizationId }
        }),
        tx.interventionArea.deleteMany({
          where: {
            project: { organizationId }
          }
        })
      ]);

      // 11. Delete project-related data
      console.log('Deleting project-related data...');
      const [projectTeamMembersDeleted, projectFundingDeleted] = await Promise.all([
        tx.projectTeamMember.deleteMany({
          where: {
            project: { organizationId }
          }
        }),
        tx.projectFunding.deleteMany({
          where: {
            project: { organizationId }
          }
        })
      ]);

      // 12. Delete programs, projects, and dashboards
      console.log('Deleting programs, projects, and dashboards...');
      const [programsDeleted, projectsDeleted, dashboardsDeleted, donorsDeleted] = await Promise.all([
        tx.program.deleteMany({
          where: { organizationId }
        }),
        tx.project.deleteMany({
          where: { organizationId }
        }),
        tx.dashboard.deleteMany({
          where: { organizationId }
        }),
        tx.donor.deleteMany({
          where: { organizationId }
        })
      ]);

      // 13. Delete location data
      console.log('Deleting location data...');
      const [villagesDeleted, gramPanchayatsDeleted, blocksDeleted, districtsDeleted, statesDeleted] = await Promise.all([
        tx.village.deleteMany({
          where: { organizationId }
        }),
        tx.gramPanchayat.deleteMany({
          where: { organizationId }
        }),
        tx.block.deleteMany({
          where: { organizationId }
        }),
        tx.district.deleteMany({
          where: { organizationId }
        }),
        tx.state.deleteMany({
          where: { organizationId }
        })
      ]);

      // 14. Delete user management data
      console.log('Deleting user management data...');
      const [permissionsDeleted, organizationRolesDeleted, organizationSettingsDeleted] = await Promise.all([
        tx.permission.deleteMany({
          where: {
            membership: { organizationId }
          }
        }),
        tx.organizationRole.deleteMany({
          where: { organizationId }
        }),
        tx.organizationSettings.deleteMany({
          where: { organizationId }
        })
      ]);

      // 15. Delete memberships (but keep users)
      console.log('Deleting memberships...');
      const membershipsDeleted = await tx.membership.deleteMany({
        where: { organizationId }
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`Cleanup completed in ${duration}ms`);

    //   // Log the cleanup action
    //   await tx.auditLog.create({
    //     data: {
    //       organizationId,
    //       action: "CLEANUP",
    //       resource: "ORGANIZATION_DATA",
    //       resourceId: organizationId,
    //       newValues: {
    //         deletedCounts: {
    //           auditLogs: auditLogsDeleted.count,
    //           notifications: notificationsDeleted.count,
    //           userSessions: userSessionsDeleted.count,
    //           attachments: attachmentsDeleted.count,
    //           trainingParticipants: trainingParticipantsDeleted.count,
    //           trainingReports: trainingReportsDeleted.count,
    //           benefitReports: benefitReportsDeleted.count,
    //           householdReports: householdReportsDeleted.count,
    //           infrastructureReports: infrastructureReportsDeleted.count,
    //           reports: reportsDeleted.count,
    //           plans: plansDeleted.count,
    //           tasks: tasksDeleted.count,
    //           indicatorMeasurements: indicatorMeasurementsDeleted.count,
    //           indicators: indicatorsDeleted.count,
    //           orgIndicators: orgIndicatorsDeleted.count,
    //           activities: activitiesDeleted.count,
    //           subInterventions: subInterventionsDeleted.count,
    //           interventions: interventionsDeleted.count,
    //           objectives: objectivesDeleted.count,
    //           interventionAreas: interventionAreasDeleted.count,
    //           projectTeamMembers: projectTeamMembersDeleted.count,
    //           projectFunding: projectFundingDeleted.count,
    //           programs: programsDeleted.count,
    //           projects: projectsDeleted.count,
    //           dashboards: dashboardsDeleted.count,
    //           donors: donorsDeleted.count,
    //           villages: villagesDeleted.count,
    //           gramPanchayats: gramPanchayatsDeleted.count,
    //           blocks: blocksDeleted.count,
    //           districts: districtsDeleted.count,
    //           states: statesDeleted.count,
    //           permissions: permissionsDeleted.count,
    //           organizationRoles: organizationRolesDeleted.count,
    //           organizationSettings: organizationSettingsDeleted.count,
    //           memberships: membershipsDeleted.count
    //         }
    //       },
    //       ipAddress: request.headers.get('x-forwarded-for') || 
    //                 request.headers.get('x-real-ip') || 
    //                 undefined,
    //       userAgent: request.headers.get('user-agent') || undefined,
    //       timestamp: new Date(),
    //     }
    //   });

      return {
        message: "Organization data cleanup completed successfully",
        organizationId,
        organizationName: organization.name,
        deletedCounts: {
          auditLogs: auditLogsDeleted.count,
          notifications: notificationsDeleted.count,
          userSessions: userSessionsDeleted.count,
          attachments: attachmentsDeleted.count,
          trainingParticipants: trainingParticipantsDeleted.count,
          trainingReports: trainingReportsDeleted.count,
          benefitReports: benefitReportsDeleted.count,
          householdReports: householdReportsDeleted.count,
          infrastructureReports: infrastructureReportsDeleted.count,
          reports: reportsDeleted.count,
          plans: plansDeleted.count,
          tasks: tasksDeleted.count,
          indicatorMeasurements: indicatorMeasurementsDeleted.count,
          indicators: indicatorsDeleted.count,
          orgIndicators: orgIndicatorsDeleted.count,
          activities: activitiesDeleted.count,
          subInterventions: subInterventionsDeleted.count,
          interventions: interventionsDeleted.count,
          objectives: objectivesDeleted.count,
          interventionAreas: interventionAreasDeleted.count,
          projectTeamMembers: projectTeamMembersDeleted.count,
          projectFunding: projectFundingDeleted.count,
          programs: programsDeleted.count,
          projects: projectsDeleted.count,
          dashboards: dashboardsDeleted.count,
          donors: donorsDeleted.count,
          villages: villagesDeleted.count,
          gramPanchayats: gramPanchayatsDeleted.count,
          blocks: blocksDeleted.count,
          districts: districtsDeleted.count,
          states: statesDeleted.count,
          permissions: permissionsDeleted.count,
          organizationRoles: organizationRolesDeleted.count,
          organizationSettings: organizationSettingsDeleted.count,
          memberships: membershipsDeleted.count
        }
      };
    }, {
      timeout: 30000 // 30 seconds timeout
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error("Error during organization cleanup:", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      { status: 500 }
    );
  }
}