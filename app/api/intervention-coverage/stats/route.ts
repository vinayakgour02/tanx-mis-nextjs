import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";

// GET /api/intervention-coverage/stats - Get statistics for intervention coverage
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const organizationId = session.user.organizationId;

    // Get counts for all levels
    const [
      totalStates,
      totalDistricts,
      totalBlocks,
      totalGramPanchayats,
      totalVillages,
    ] = await Promise.all([
      prisma.state.count({
        where: { organizationId },
      }),
      prisma.district.count({
        where: { organizationId },
      }),
      prisma.block.count({
        where: { organizationId },
      }),
      prisma.gramPanchayat.count({
        where: { organizationId },
      }),
      prisma.village.count({
        where: {
          gramPanchayat: {
            organizationId,
          },
        },
      }),
    ]);

    const stats = {
      totalStates,
      totalDistricts,
      totalBlocks,
      totalGramPanchayats,
      totalVillages,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('[INTERVENTION_COVERAGE_STATS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}