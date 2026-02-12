export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
// import puppeteer from "puppeteer";
import { prisma } from "@/lib/prisma"
import nodemailer from "nodemailer"

// --- Type Definitions ---
interface Assessment {
  [key: string]: (number | null)[]
}

interface FormData {
  organizationName: string
  phone: number,
  email?: string
  headName?: string
  assessments: Assessment
}

interface AreaResult {
  id: string
  title: string
  indicators: string[]
  score: number
  maxScore: number
  starRating: number
  percentage: number
}

interface Results {
  areaResults: AreaResult[]
  totalScore: number
  maxTotalScore: number
  overallStarRating: number
  overallPercentage: number
}

// --- Utility: prettify area id to a readable title ---
function prettifyAreaId(id: string): string {
  return id
    .replace(/([a-z])([A-Z])/g, "$1 $2") // handle camelCase → camel Case
    .replace(/[_-]/g, " ")               // handle snake_case & kebab-case → snake case
    .replace(/\s+/g, " ")                // normalize spaces
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase()) // capitalize first letters
}

// --- Function to save assessment data to database ---
async function saveAssessmentToDatabase(formData: FormData, results: Results): Promise<string> {
  try {
    const assessment = await prisma.assessment.create({
      data: {
        organizationName: formData.organizationName,
        email: formData.email || "",
        headName: formData.headName || "",
        totalScore: results.totalScore,
        maxTotalScore: results.maxTotalScore,
        overallPercentage: results.overallPercentage,
        overallStarRating: results.overallStarRating,
        areaResults: {
          create: results.areaResults.map((area) => ({
            areaId: area.id,
            title: area.title,
            score: area.score,
            maxScore: area.maxScore,
            percentage: area.percentage,
            starRating: area.starRating,
            responses: formData.assessments[area.id] || []
          }))
        }
      },
      include: {
        areaResults: true
      }
    })
    
    console.log(`Assessment saved to database with ID: ${assessment.id}`)
    return assessment.id
  } catch (error) {
    console.error("Error saving assessment to database:", error)
    throw new Error("Failed to save assessment data")
  }
}


// --- Fallback: compute results from formData.assessments if backend returns empty/zero ---
function computeResultsFromForm(formData: FormData): Results {
  const areaResults: AreaResult[] = Object.entries(formData.assessments).map(([id, responses]) => {
    const maxScore = responses.length // assume each indicator = 1
    const score = responses.reduce<number>(
      (s, r) => s + (typeof r === "number" && r > 0 ? r : 0),
      0
    );

    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    // star mapping (adjust if you have different rules)
    let starRating = 1
    if (percentage >= 80) starRating = 5
    else if (percentage >= 60) starRating = 4
    else if (percentage >= 40) starRating = 3
    else if (percentage >= 20) starRating = 2
    else starRating = 1

    const indicators = responses.map((_, idx) => `Indicator ${idx + 1}`)

    return {
      id,
      title: prettifyAreaId(id),
      indicators,
      score,
      maxScore,
      starRating,
      percentage,
    } as AreaResult
  })

  const totalScore = areaResults.reduce((s, a) => s + a.score, 0)
  const maxTotalScore = areaResults.reduce((s, a) => s + a.maxScore, 0)
  const overallPercentage = maxTotalScore > 0 ? Math.round((totalScore / maxTotalScore) * 100) : 0

  let overallStarRating = 1
  if (overallPercentage >= 80) overallStarRating = 5
  else if (overallPercentage >= 60) overallStarRating = 4
  else if (overallPercentage >= 40) overallStarRating = 3
  else if (overallPercentage >= 20) overallStarRating = 2
  else overallStarRating = 1

  return {
    areaResults,
    totalScore,
    maxTotalScore,
    overallStarRating,
    overallPercentage,
  }
}

function hasNonZeroResults(results?: Results): boolean {
  if (!results) return false
  if (results.totalScore > 0) return true
  return results.areaResults.some((a) => a.score > 0 || a.percentage > 0)
}

// --- Build AI prompt (we request HTML) ---
function buildAIPrompt(formData: FormData, results: Results): string {
  const { organizationName } = formData
  const { areaResults, totalScore, overallStarRating, overallPercentage } = results

  const strongAreas = areaResults
    .filter((area) => area.percentage >= 80)
    .map((area) => `<li>${area.title} (${area.percentage}%)</li>`)
    .join("")

  const moderateAreas = areaResults
    .filter((area) => area.percentage >= 40 && area.percentage < 80)
    .map((area) => `<li>${area.title} (${area.percentage}%)</li>`)
    .join("")

  const criticalAreas = areaResults
    .filter((area) => area.percentage < 40)
    .map((area) => `<li>${area.title} (${area.percentage}%)</li>`)
    .join("")

  const detailedGaps = areaResults
    .map((area) => {
      const userResponses = formData.assessments[area.id] || []
      const areaGaps = userResponses
        .map((r, idx) => (r === 0 ? `Indicator ${idx + 1}` : null))
        .filter((x) => x)
        .join("; ")

      return areaGaps ? `<h4>${area.title} - Score: ${area.score}/${area.maxScore}</h4><p>Gaps: ${areaGaps}</p>` : ""
    })
    .join("<br/>")

  return `You are a senior MEL consultant from tanX Innovations LLP.
Generate a professional MEL Assessment Report for "${organizationName}" in pure HTML.
Use <h2> for section titles, <p> for paragraphs, <ul>/<li> for lists, <h3>/<h4> for subsections.
No Markdown fences.

⚠️ Do NOT include a top-level document title such as "Monitoring, Evaluation, and Learning (MEL) Assessment Report" 
because the cover page already contains it. Begin directly with the requested sections.


Assessment Results: ${totalScore}/${results.maxTotalScore} (${overallPercentage}%) - ${overallStarRating}/5 Stars.

<h3>Strong Areas</h3>
<ul>${strongAreas || "<li>None identified</li>"}</ul>

<h3>Areas Needing Improvement</h3>
<ul>${moderateAreas || "<li>None identified</li>"}</ul>

<h3>Critical Areas</h3>
<ul>${criticalAreas || "<li>None identified</li>"}</ul>

<h3>Gap Analysis</h3>
${detailedGaps}

Now generate HTML sections:
<h2>EXECUTIVE SUMMARY</h2>
Write 2-3 paragraphs covering overall MEL maturity, key findings, and opportunities.


<h2>CRITICAL GAPS ANALYSIS</h2>
For each critical area, explain the gap, impact, and risks if not addressed.

<h2>STRATEGIC RECOMMENDATIONS</h2>
<ol>
<li>Digital Infrastructure & MIS Enhancement</li>
<li>Capacity Building & Training</li>
<li>Process Standardization</li>
</ol>

<h2>IMPLEMENTATION ROADMAP</h2>
<h4>Phase 1: Foundation Building (0-3 months)</h4>
<h4>Phase 2: System Enhancement (3-12 months)</h4>
<h4>Phase 3: Excellence & Innovation (12+ months)</h4>

<h2>TECHNOLOGY SOLUTIONS</h2>
Explain how tanX Innovations MIS platform addresses gaps. Mention https://mis.tanxinnovations.com/features.

<h2>ROI AND VALUE PROPOSITION</h2>
Quantify benefits including 30–50% time savings, improved data quality, enhanced donor confidence.

<h2>CONCLUSION AND NEXT STEPS</h2>
Encouraging conclusion with invitation for MIS demo and consultation.`
}

// --- Create the PDF using Puppeteer with professional styling ---
async function createPdf(htmlContent: string, formData: FormData, results: Results): Promise<Buffer> {
  // Vercel -------
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 1280, height: 800 },
    executablePath: await chromium.executablePath(),
    headless: true, // Sparticuz defaults are safe
  });

  // DEvelopment ---------
  // const browser = await puppeteer.launch({
  //   headless: true,
  //   args: ["--no-sandbox", "--disable-setuid-sandbox"],
  // })


  try {
    const page = await browser.newPage()

    // Professional PDF template with proper page breaks and margins
    const template = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4;
            margin: 2cm 2cm 3cm 2cm;
            @top-center {
              content: "MEL Assessment Report - ${formData.organizationName || "Organization"}";
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              font-size: 10px;
              color: #666;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
            @bottom-center {
              content: "Page " counter(page) " of " counter(pages);
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              font-size: 10px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 5px;
            }
            @bottom-left {
              content: "Generated on ${new Date().toLocaleDateString()}";
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              font-size: 9px;
              color: #999;
            }
            @bottom-right {
              content: "tanX Innovations LLP";
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              font-size: 9px;
              color: #999;
            }
          }
          
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background: white;
          }
          
          .cover-page {
            text-align: center;
            padding: 6cm 2cm 4cm 2cm;
            page-break-after: always;
            background: linear-gradient(135deg,rgb(249, 244, 240) 0%,rgb(253, 250, 245) 100%);
            color: black;
            margin: -2cm -2cm -3cm -2cm;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            box-sizing: border-box;
          }
          
          .cover-content {
            max-width: 80%;
            margin: 0 auto;
          }
          
          .cover-title {
            font-size: 42px;
            font-weight: bold;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            line-height: 1.2;
          }
          
          .cover-subtitle {
            font-size: 24px;
            margin-bottom: 40px;
            opacity: 0.9;
            font-weight: 300;
          }
          
          .cover-org {
            font-size: 32px;
            font-weight: 600;
            margin: 40px 0;
            padding: 20px;
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            backdrop-filter: blur(10px);
          }
          
          .cover-score {
            font-size: 18px;
            margin: 30px 0;
            padding: 15px;
            background: rgba(255,255,255,0.15);
            border-radius: 8px;
            line-height: 1.4;
          }
          
          .cover-footer {
            margin-top: 50px;
            font-size: 16px;
            opacity: 0.8;
          }
          
          h1 { 
            color: #FF7A00; 
            font-size: 28px;
            margin: 30px 0 20px 0;
            page-break-after: avoid;
            border-bottom: 3px solid #FF7A00;
            padding-bottom: 10px;
          }
          
          h2 { 
            color: #FF7A00; 
            font-size: 22px;
            margin: 25px 0 15px 0;
            page-break-after: avoid;
            border-left: 4px solid #FF7A00;
            padding-left: 15px;
          }
          
          h3 {
            color: #333;
            font-size: 18px;
            margin: 20px 0 10px 0;
            page-break-after: avoid;
          }
          
          h4 {
            color: #555;
            font-size: 16px;
            margin: 15px 0 8px 0;
            page-break-after: avoid;
          }
          
          p {
            margin: 10px 0;
            text-align: justify;
            orphans: 3;
            widows: 3;
          }
          
          ul, ol {
            margin: 10px 0;
            padding-left: 25px;
          }
          
          li {
            margin: 5px 0;
            page-break-inside: avoid;
          }
          
          .sectionExcute {
    padding-top: 0.5cm;   /* reduced */
    margin-bottom: 0.5cm; /* reduced */
    page-break-inside: avoid;
  }

  .summary-box { 
    border: 1px solid #FF7A00; 
    padding: 6px; 
    margin: 6px 0 10px 0;
    text-align: center;
    background: #FFFDF9;
    border-radius: 4px;
  }

  .summary-score {
    font-size: 16px;
    font-weight: 600;
    color: #FF7A00;
    margin: 3px 0;
  }

  .summary-rating {
    font-size: 14px;
    color: #FFB800;
    margin: 3px 0;
  }

  table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 10px 0;
            page-break-inside: avoid;
            background: white;
            font-size: 13px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          th, td { 
            border: 1px solid #ddd; 
            padding: 6px 4px; 
            text-align: left; 
            font-size: 12px; 
            vertical-align: top;
          }
          
          th { 
            background: #FF7A00;
            color: white;
            font-weight: 600;
            text-align: center;
          }
          
          tr:nth-child(even) {
            background: #f9f9f9;
          }
          
          tr:hover {
            background: #f5f5f5;
          }
          
          .score-high { color: #28a745; font-weight: bold; }
          .score-medium { color: #ffc107; font-weight: bold; }
          .score-low { color: #dc3545; font-weight: bold; }
          
          .page-break {
            page-break-before: always;
          }
          
          .avoid-break {
            page-break-inside: avoid;
          }
          
          .section {
            margin: 25px 0;
            page-break-inside: avoid;
          }
          
          .recommendation-box {
            background: #f8f9fa;
            border-left: 4px solid #FF7A00;
            padding: 15px;
            margin: 15px 0;
            border-radius: 0 5px 5px 0;
            page-break-inside: avoid;
          }
          
          .phase-box {
            background: #fff;
            border: 1px solid #ddd;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
            page-break-inside: avoid;
          }
          
          .phase-title {
            color: #FF7A00;
            font-weight: bold;
            margin-bottom: 10px;
          }
          
          .footer-info {
            margin-top: 40px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            text-align: center;
            font-size: 12px;
            color: #666;
            page-break-inside: avoid;
          }
          
          .contact-info {
            margin: 10px 0;
            font-weight: 600;
            color: #FF7A00;
          }
          
          a {
            color: #FF7A00;
            text-decoration: none;
          }
          
          a:hover {
            text-decoration: underline;
          }
          
          .stars {
            color: #FFB800;
            font-size: 16px;
          }

          .execut {
           page-break-inside: avoid;

          }
        </style>
      </head>
      <body>
        <!-- Cover Page -->
        <div class="cover-page">
          <div class="cover-content">
      <img 
  src="https://ik.imagekit.io/blogapp777/playstore.png?updatedAt=1756434276583" 
  alt="tanX Logo" 
  style="width:120px; margin-bottom:20px; border-radius:50%; border:2px solid #ddd;" 
/>

            <div class="cover-title">MEL SYSTEM</div>
            <div class="cover-subtitle">ASSESSMENT REPORT</div>
            <div class="cover-org">${formData.organizationName || "Organization Name"}</div>
            <div class="cover-score">
              <div>Overall Score: ${results.totalScore}/${results.maxTotalScore} (${results.overallPercentage}%)</div>
              <div style="margin-top: 8px;">Rating: ${"★".repeat(results.overallStarRating)}${"☆".repeat(5 - results.overallStarRating)} (${results.overallStarRating}/5)</div>
            </div>
            <div class="cover-footer">
              <div>Powered by tanX Innovations LLP</div>
              <div><a href="https://mis.tanxinnovations.com" style="color: white;">mis.tanxinnovations.com</a></div>
            </div>
          </div>
        </div>

        <!-- Executive Summary Page -->
       <div style="page-break-inside: avoid;">

  <!-- Executive Summary -->
  <div class="sectionExcute">
    <h2>Executive Summary</h2>
    <div class="summary-box">
      <div class="summary-score">Overall Score: 3.8 / 5</div>
      <div class="summary-rating">Rating: Strong</div>
    </div>
    <p style="font-size:13px; line-height:1.4; margin-top:6px;">
      This assessment provides an overview of your organization’s Monitoring, Evaluation,
      and Learning (MEL) system performance, highlighting strengths and areas for
      improvement.
    </p>
  </div>

  <!-- Assessment Overview -->
  <div class="section">
    <h2>Assessment Overview</h2>
    <table>
            <thead>
              <tr>
                <th>MEL Criteria</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Rating</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${results.areaResults
                .map(
                  (area) => `
                    <tr>
                      <td><strong>${area.title}</strong></td>
                      <td>${area.score}/${area.maxScore}</td>
                      <td class="${area.percentage >= 80 ? "score-high" : area.percentage >= 40 ? "score-medium" : "score-low"}">${area.percentage}%</td>
                      <td class="stars">
                        ${Array(area.starRating).fill('<svg width="14" height="14" viewBox="0 0 24 24" fill="#FFB800"><path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.782 1.402 8.172L12 18.896l-7.336 3.868 1.402-8.172L.132 9.21l8.2-1.192z"/></svg>').join('')}
                        ${Array(5 - area.starRating).fill('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFB800" stroke-width="2"><path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.782 1.402 8.172L12 18.896l-7.336 3.868 1.402-8.172L.132 9.21l8.2-1.192z"/></svg>').join('')}
                      </td>

                      <td class="${area.percentage >= 80 ? "score-high" : area.percentage >= 40 ? "score-medium" : "score-low"}">
                        ${area.percentage >= 80 ? "Strong" : area.percentage >= 40 ? "Moderate" : "Critical"}
                      </td>
                    </tr>
                  `,
                )
                .join("")}
            </tbody>
          </table>
  </div>

</div>

        <!-- Main Report Content -->
        <div class="page-break">
          <h1>DETAILED ANALYSIS: ${formData.organizationName || "Organization Name"}</h1>
          ${htmlContent}
        </div>

        <!-- Footer Information -->
        <div class="footer-info">
          <div class="contact-info">tanX Innovations LLP</div>
          <div>MEL System Strengthening & Digital Transformation</div>
          <div><a href="https://mis.tanxinnovations.com">mis.tanxinnovations.com</a></div>
          
          <div>Email: <a href="mailto:info@tanxinnovations.com">info@tanxinnovations.com</a></div>
          <div>Mobile: <a href="tel:+919826783036">+91 98267 83036</a></div>
          <div>For more details, contact <strong>Dr. Vishal Nayak</strong>, CEO, tanX Innovations</div>
          
          <div style="margin-top: 15px;">
            <strong>Ready to transform your MEL system?</strong><br>
            Contact us for a personalized demo and consultation.
          </div>
        </div>
      </body>
      </html>
    `

    await page.setContent(template, { waitUntil: "networkidle0" })

    const pdfBytes = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate: "<div></div>",
      margin: {
        top: "2cm",
        right: "2cm",
        bottom: "3cm",
        left: "2cm",
      },
    })

    return Buffer.from(pdfBytes)
  } finally {
    await browser.close()
  }
}

// --- Function to send email with PDF attachment ---
async function sendAssessmentEmail(email: string, organizationName: string, headName: string, pdfBuffer: Buffer) {
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

    const mailOptions = {
      from: 'info@tanxinnovations.com',
      to: email,
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
      `,
      attachments: [
        {
          filename: `MEL_Assessment_Report_${(organizationName || "org").replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`,
          content: pdfBuffer
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    console.log(`Assessment report email sent successfully to ${email}`);
  } catch (error) {
    console.error("Error sending assessment email:", error);
    // Don't throw error as we don't want email failure to break the main flow
  }
}

// --- POST handler ---
export async function POST(req: NextRequest) {
  try {
    const formData = (await req.json()) as FormData

    // Step 1: submit to MIS backend
    let backendResults: Results | null = null
    try {
      const misResponse = await fetch("https://mis-backend.tanxinnovations.com/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const misText = await misResponse.text()
      try {
        backendResults = misResponse.ok ? (JSON.parse(misText) as Results) : null
      } catch (parseErr) {
        console.warn("generate-report: failed to parse MIS response as JSON:", parseErr)
        backendResults = null
      }

    } catch (err) {
      console.warn("generate-report: error calling MIS backend:", err)
      backendResults = null
    }

    // If backend results are missing or all-zero, compute fallback from formData
    const fallbackResults = computeResultsFromForm(formData)
    // @ts-ignore
    const resultsToUse = hasNonZeroResults(backendResults) ? backendResults! : fallbackResults
    // @ts-ignore
    if (!hasNonZeroResults(backendResults)) {
      console.warn("generate-report: using fallback computed results (backend missing/zero).")
    }

    // Step 2: Save assessment data to database
    let assessmentId: string | null = null
    try {
      assessmentId = await saveAssessmentToDatabase(formData, resultsToUse)
      console.log(`Assessment saved successfully with ID: ${assessmentId}`)
    } catch (dbError) {
      console.error("Failed to save assessment to database:", dbError)
      // Continue with PDF generation even if database save fails
    }

    // Step 3: AI content generation (request HTML)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    const prompt = buildAIPrompt(formData, resultsToUse)

    const aiResult = await model.generateContent(prompt)
    let reportHtml = aiResult.response.text()

    // Strip triple backtick fences if present (\`\`\`html ... \`\`\` or \`\`\` ... \`\`\`)
    reportHtml = reportHtml
      .replace(/```(?:html)?/g, "")
      .replace(/```/g, "")
      .trim()

    // Step 4: generate PDF with Puppeteer
    const pdfBuffer = await createPdf(reportHtml, formData, resultsToUse)

    const sanitizedOrgName = (formData.organizationName || "org").replace(/[^a-zA-Z0-9]/g, "_")
    const filename = `MEL_Assessment_Report_${sanitizedOrgName}_${new Date().toISOString().split("T")[0]}.pdf`

    // Step 5: Send email with PDF attachment if email is provided
    if (formData.email) {
      await sendAssessmentEmail(formData.email, formData.organizationName, formData.headName || '', pdfBuffer);
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
        ...(assessmentId && { "X-Assessment-ID": assessmentId }), // Include assessment ID in response headers
      },
    })
  } catch (error: any) {
    console.error("Error generating report:", error)
    return NextResponse.json(
      { message: "Failed to generate PDF report.", error: error?.message ?? String(error) },
      { status: 500 },
    )
  }
}
