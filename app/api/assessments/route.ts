import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import nodemailer from "nodemailer"

// GET /api/assessments - Retrieve all assessments
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const organizationName = searchParams.get("organizationName")
    const email = searchParams.get("email")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    // Build where clause for filtering
    const where: any = {}
    if (organizationName) {
      where.organizationName = {
        contains: organizationName,
        mode: "insensitive"
      }
    }
    if (email) {
      where.email = {
        contains: email,
        mode: "insensitive"
      }
    }

    // Get assessments with pagination
    const [assessments, total] = await Promise.all([
      prisma.assessment.findMany({
        where,
        include: {
          areaResults: true
        },
        orderBy: {
          createdAt: "desc"
        },
        skip,
        take: limit
      }),
      prisma.assessment.count({ where })
    ])

    return NextResponse.json({
      assessments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching assessments:", error)
    return NextResponse.json(
      { message: "Failed to fetch assessments", error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// POST /api/assessments - Create new assessment (alternative to generate-report)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { organizationName, email, headName, assessments, results } = body

    if (!organizationName || !email || !headName) {
      return NextResponse.json(
        { message: "Missing required fields: organizationName, email, headName" },
        { status: 400 }
      )
    }

    if (!results || !results.areaResults) {
      return NextResponse.json(
        { message: "Missing assessment results" },
        { status: 400 }
      )
    }

    const assessment = await prisma.assessment.create({
      data: {
        organizationName,
        email,
        headName,
        totalScore: results.totalScore,
        maxTotalScore: results.maxTotalScore,
        overallPercentage: results.overallPercentage,
        overallStarRating: results.overallStarRating,
        areaResults: {
          create: results.areaResults.map((area: any) => ({
            areaId: area.id,
            title: area.title,
            score: area.score,
            maxScore: area.maxScore,
            percentage: area.percentage,
            starRating: area.starRating,
            responses: assessments[area.id] || []
          }))
        }
      },
      include: {
        areaResults: true
      }
    })

    // Send email notification
    try {
      await sendAssessmentEmail(email, organizationName, headName, assessment);
    } catch (emailError) {
      console.error("Failed to send assessment email:", emailError);
      // Continue even if email fails
    }

    return NextResponse.json({
      message: "Assessment saved successfully",
      assessment
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating assessment:", error)
    return NextResponse.json(
      { message: "Failed to create assessment", error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// --- Function to send email notification ---
async function sendAssessmentEmail(recipientEmail: string, organizationName: string, headName: string, assessment: any) {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.titan.email",
      port: 587,
      secure: false,
      auth: {
        user: 'info@tanxinnovations.com',
        pass: '*#Zoom2009'
      }
    });

    // Create a simple text summary of the assessment
    const areaResultsSummary = assessment.areaResults.map((area: any) => 
      `<li>${area.title}: ${area.score}/${area.maxScore} (${area.percentage}%) - ${area.starRating} stars</li>`
    ).join('');

    const mailOptions = {
      from: 'info@tanxinnovations.com',
      to: recipientEmail,
      subject: 'Your MEL Assessment Report by tanX Innovations',
      html: `
        <p>Dear ${headName || 'Valued Partner'},</p>
        <p>Thank you for completing the 5-STAR MEL Self-Assessment with tanX Innovations. We appreciate your time and effort in evaluating your organization's Monitoring, Evaluation, and Learning (MEL) practices.</p>
        <p>As a next step, we are pleased to share with you the Assessment Report, which includes:</p>
        <ul>
          <li>Summary of gaps in your current MEL system</li>
          <li>Key areas for improvement</li>
          <li>Overall, 5-STAR MEL rating</li>
          <li>Criteria-wise analysis for deeper insights</li>
          <li>Practical action plan to strengthen MEL practices</li>
        </ul>
        <p><strong>Assessment Summary:</strong></p>
        <ul>
          <li>Overall Score: ${assessment.totalScore}/${assessment.maxTotalScore} (${assessment.overallPercentage}%)</li>
          <li>Overall Rating: ${assessment.overallStarRating} stars</li>
        </ul>
        <p><strong>Area-wise Results:</strong></p>
        <ul>
          ${areaResultsSummary}
        </ul>
        <p>Alongside the assessment, we would also like to introduce you to our Social Impact Analysis – MIS Platform, specifically designed for comprehensive monitoring and evaluations. This platform enables organizations to:</p>
        <ul>
          <li>Align projects and program indicators with organizational indicators</li>
          <li>Track outputs, outcomes, and long-term impact seamlessly</li>
          <li>Real-time field reporting for evidence-based decision-making</li>
          <li>Intuitive dashboards for management, program, and field teams</li>
        </ul>
        <p>📖 You can learn more about the MIS Platform here: <a href="https://mis.tanxinnovations.com/documentation">https://mis.tanxinnovations.com/documentation</a></p>
        <p>We believe the combination of the MEL Assessment Tool and the Social Impact Analysis MIS Platform will provide your organization with a robust framework to measure, learn, and communicate social change effectively.</p>
        <p>Should you be interested in exploring how tanX Innovations can support you further in implementing these solutions, please feel free to reach out. We would be glad to discuss the next steps with you.</p>
        <p>With regards,</p>
        <p><strong>Dr. Vishal Nayak</strong><br>
        Chief Executive Officer,<br>
        tanX Innovations LLP<br>
        info@tanxinnovations.com<br>
        Mobile - +91 9826783036</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Assessment notification email sent successfully to ${recipientEmail}`);
  } catch (error) {
    console.error("Error sending assessment email:", error);
    // Don't throw error as we don't want email failure to break the main flow
  }
}