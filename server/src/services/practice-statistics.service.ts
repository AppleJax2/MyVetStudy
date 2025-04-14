import prisma from '../utils/prisma.client';
import AppError from '../utils/appError';

/**
 * Interface for dashboard statistics
 */
export interface PracticeStatistics {
  summary: {
    totalPatients: number;
    activePatients: number;
    totalMonitoringPlans: number;
    activeMonitoringPlans: number;
    teamMembers: number;
    totalObservations: number;
    recentObservations: number; // Last 7 days
  };
  patientsBySpecies: Array<{
    species: string;
    count: number;
  }>;
  monitoringPlansByStatus: Array<{
    status: string;
    count: number;
  }>;
  observationsTrend: Array<{
    date: string;
    count: number;
  }>;
  activityLog: Array<{
    id: string;
    type: string;
    description: string;
    userId: string;
    userName: string;
    timestamp: Date;
  }>;
}

/**
 * Get comprehensive statistics for a practice dashboard
 * @param practiceId - ID of the practice to get statistics for
 * @returns Dashboard statistics object
 */
export const getPracticeStatistics = async (practiceId: string): Promise<PracticeStatistics> => {
  try {
    // Verify practice exists
    const practiceExists = await prisma.practice.count({ where: { id: practiceId } });
    if (practiceExists === 0) {
      throw new AppError('Practice not found', 404);
    }

    // Calculate date ranges
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

    // Get summary counts
    const totalPatients = await prisma.patient.count({
      where: { practiceId }
    });

    const activePatients = await prisma.patient.count({
      where: { 
        practiceId,
        isActive: true
      }
    });

    const totalMonitoringPlans = await prisma.monitoringPlan.count({
      where: { practiceId }
    });

    const activeMonitoringPlans = await prisma.monitoringPlan.count({
      where: { 
        practiceId,
        status: 'ACTIVE'
      }
    });

    const teamMembers = await prisma.user.count({
      where: { 
        practiceId,
        isActive: true
      }
    });

    // Get observations count
    const totalObservations = await prisma.observation.count({
      where: {
        patient: {
          practiceId
        }
      }
    });

    const recentObservations = await prisma.observation.count({
      where: {
        patient: {
          practiceId
        },
        recordedAt: {
          gte: oneWeekAgo
        }
      }
    });

    // Get patient distribution by species
    const patientsBySpecies = await prisma.$queryRaw<Array<{ species: string, count: number }>>`
      SELECT "species", COUNT(*) as "count"
      FROM "Patient"
      WHERE "practiceId" = ${practiceId}
      GROUP BY "species"
      ORDER BY "count" DESC
    `;

    // Get monitoring plans by status
    const monitoringPlansByStatus = await prisma.$queryRaw<Array<{ status: string, count: number }>>`
      SELECT "status", COUNT(*) as "count"
      FROM "MonitoringPlan"
      WHERE "practiceId" = ${practiceId}
      GROUP BY "status"
      ORDER BY "count" DESC
    `;

    // Get observations trend for the last 30 days
    const observationsByDay = await prisma.$queryRaw<Array<{ date: string, count: number }>>`
      SELECT TO_CHAR("recordedAt", 'YYYY-MM-DD') as "date", COUNT(*) as "count"
      FROM "Observation" o
      JOIN "Patient" p ON o."patientId" = p."id"
      WHERE p."practiceId" = ${practiceId}
        AND o."recordedAt" >= ${oneMonthAgo}
      GROUP BY TO_CHAR("recordedAt", 'YYYY-MM-DD')
      ORDER BY "date"
    `;

    // Fill in missing dates in the observations trend
    const observationsTrend: Array<{ date: string, count: number }> = [];
    const dateMap = new Map<string, number>();
    
    // Populate the map with counts from the query
    observationsByDay.forEach(day => {
      dateMap.set(day.date, day.count);
    });
    
    // Fill in all dates in the range
    for (let d = new Date(oneMonthAgo); d <= now; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      observationsTrend.push({
        date: dateStr,
        count: dateMap.get(dateStr) || 0
      });
    }

    // Get recent activity log
    // For now, we'll focus on recent monitoring plan creation/updates and patient registrations
    const recentMonitoringPlanActivity = await prisma.monitoringPlan.findMany({
      where: {
        practiceId,
        updatedAt: {
          gte: oneWeekAgo
        }
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        createdById: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10
    });

    const recentPatientActivity = await prisma.patient.findMany({
      where: {
        practiceId,
        updatedAt: {
          gte: oneWeekAgo
        }
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        createdById: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10
    });

    // Combine and format activity log
    const activityLog = [
      ...recentMonitoringPlanActivity.map(plan => ({
        id: plan.id,
        type: plan.createdAt.getTime() === plan.updatedAt.getTime() ? 'MONITORING_PLAN_CREATED' : 'MONITORING_PLAN_UPDATED',
        description: plan.createdAt.getTime() === plan.updatedAt.getTime() 
          ? `Monitoring plan "${plan.title}" created` 
          : `Monitoring plan "${plan.title}" updated`,
        userId: plan.createdById,
        userName: `${plan.createdBy.firstName} ${plan.createdBy.lastName}`,
        timestamp: plan.updatedAt
      })),
      ...recentPatientActivity.map(patient => ({
        id: patient.id,
        type: patient.createdAt.getTime() === patient.updatedAt.getTime() ? 'PATIENT_CREATED' : 'PATIENT_UPDATED',
        description: patient.createdAt.getTime() === patient.updatedAt.getTime() 
          ? `Patient "${patient.name}" registered` 
          : `Patient "${patient.name}" information updated`,
        userId: patient.createdById,
        userName: `${patient.createdBy.firstName} ${patient.createdBy.lastName}`,
        timestamp: patient.updatedAt
      }))
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
     .slice(0, 15); // Limit to most recent 15 activities

    return {
      summary: {
        totalPatients,
        activePatients,
        totalMonitoringPlans,
        activeMonitoringPlans,
        teamMembers,
        totalObservations,
        recentObservations
      },
      patientsBySpecies,
      monitoringPlansByStatus,
      observationsTrend,
      activityLog
    };
  } catch (error) {
    console.error('Error getting practice statistics:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to retrieve practice statistics', 500);
  }
}; 