import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET(req: Request) {
    try {
     
      const interventionAreas = await prisma.interventionArea.findMany({
        orderBy: {
          serialNumber: 'asc',
        },
        include:{
          project: {
            select: {
              name: true,
              code: true,
            },
          },
        },
      });
  
      return NextResponse.json(interventionAreas);
    } catch (error) {
      console.error('[INTERVENTION_AREAS_GET]', error);
      return new NextResponse('Internal Error', { status: 500 });
    }
  }