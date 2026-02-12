import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/assessments/[id] - Retrieve specific assessment by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        areaResults: true
      }
    })

    if (!assessment) {
      return NextResponse.json(
        { message: "Assessment not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ assessment })
  } catch (error) {
    console.error("Error fetching assessment:", error)
    return NextResponse.json(
      { message: "Failed to fetch assessment", error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// DELETE /api/assessments/[id] - Delete specific assessment
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Check if assessment exists
    const assessment = await prisma.assessment.findUnique({
      where: { id }
    })

    if (!assessment) {
      return NextResponse.json(
        { message: "Assessment not found" },
        { status: 404 }
      )
    }

    // Delete assessment (will cascade delete area results)
    await prisma.assessment.delete({
      where: { id }
    })

    return NextResponse.json({
      message: "Assessment deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting assessment:", error)
    return NextResponse.json(
      { message: "Failed to delete assessment", error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// PUT /api/assessments/[id] - Update specific assessment
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await req.json()
    const { organizationName, email, headName, totalScore, maxTotalScore, overallPercentage, overallStarRating } = body

    // Check if assessment exists
    const existingAssessment = await prisma.assessment.findUnique({
      where: { id }
    })

    if (!existingAssessment) {
      return NextResponse.json(
        { message: "Assessment not found" },
        { status: 404 }
      )
    }

    // Update assessment
    const updatedAssessment = await prisma.assessment.update({
      where: { id },
      data: {
        ...(organizationName && { organizationName }),
        ...(email && { email }),
        ...(headName && { headName }),
        ...(totalScore !== undefined && { totalScore }),
        ...(maxTotalScore !== undefined && { maxTotalScore }),
        ...(overallPercentage !== undefined && { overallPercentage }),
        ...(overallStarRating !== undefined && { overallStarRating })
      },
      include: {
        areaResults: true
      }
    })

    return NextResponse.json({
      message: "Assessment updated successfully",
      assessment: updatedAssessment
    })
  } catch (error) {
    console.error("Error updating assessment:", error)
    return NextResponse.json(
      { message: "Failed to update assessment", error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}