import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession();
        if (!session?.user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const program = await prisma.program.findUnique({
            where: { id: id }
        });


        if (!program) {
            return new NextResponse('Program not found', { status: 404 });
        }

        return NextResponse.json(program);
    } catch (error) {
        console.error('[PROGRAM_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}