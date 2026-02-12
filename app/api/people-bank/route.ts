import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/utils/authOptions"

export async function GET() {
  const session = await getServerSession(authOptions)
  const orgId = (session?.user as any)?.organizationId
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const people = await prisma.peopleBank.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(people)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const orgId = (session?.user as any)?.organizationId
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const data = await req.json()
  const created = await prisma.peopleBank.create({
    data: { ...data, organizationId: orgId },
  })
  return NextResponse.json(created)
}

export async function PUT(req: Request) {
  const data = await req.json()
  const updated = await prisma.peopleBank.update({
    where: { id: data.id },
    data,
  })
  return NextResponse.json(updated)
}

export async function DELETE(req: Request) {
  const { id } = await req.json()
  await prisma.peopleBank.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
