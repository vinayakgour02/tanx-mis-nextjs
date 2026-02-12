import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Clear old subscription plans (optional)
    await prisma.subscriptionPlan.deleteMany();

    // Insert subscription plans
    await prisma.subscriptionPlan.createMany({
      data: [
        {
          name: "Demo User",
          type: "DEMO",
          description: "Free trial for 1 month, 1 active project",
          price: 0,
          durationInDays: 30,
          projectsAllowed: 1

        },
        {
          name: "Basic User - Monthly",
          type: "BASIC_MONTHLY",
          description: "Max 5 active projects, 1 dashboard page",
          price: 9786,
          durationInDays: 30,
          projectsAllowed: 5,
        },
        {
          name: "Basic User - Annual",
          type: "BASIC_ANNUAL",
          description: "Max 5 active projects, 1 dashboard page",
          price: 9786 * 12,
          projectsAllowed: 5,
          durationInDays: 365,
        },
        {
          name: "Premium User - Monthly",
          type: "PREMIUM_MONTHLY",
          description: "Max 15 active projects, 5 dashboard pages",
          price: 21786,
          durationInDays: 30,
          projectsAllowed: 15,
        },
        {
          name: "Premium User - Annual",
          type: "PREMIUM_ANNUAL",
          description: "Max 15 active projects, 5 dashboard pages",
          price: 21786 * 12,
          durationInDays: 365,
          projectsAllowed: 15,
        },
        {
          name: "Advance User - Monthly",
          type: "ADVANCE_MONTHLY",
          description: "Unlimited projects, all features",
          price: 101786,
          durationInDays: 30,
          projectsAllowed: 105,  
        },
        {
          name: "Advance User - Annual",
          type: "ADVANCE_ANNUAL",
          description: "Unlimited projects, all features",
          price: 101786 * 12,
          durationInDays: 365,
          projectsAllowed: 105,
        },
      ],
    });

    return NextResponse.json({ message: "✅ Subscription plans seeded successfully!" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Seeding failed", details: String(error) }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
