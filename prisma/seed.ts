import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Clear old plans
  await prisma.subscriptionPlan.deleteMany()

  await prisma.subscriptionPlan.createMany({
    data: [
      {
        name: "Demo User",
        type: "DEMO",
        description: "Free trial for 1 month, 1 active project, test features only",
        price: 0,
        durationInDays: 30,
      },
      {
        name: "Basic User - Monthly",
        type: "BASIC_MONTHLY",
        description: "Max 5 active projects, 1 dynamic dashboard page",
        price: 9786,
        durationInDays: 30,
      },
      {
        name: "Basic User - Annual",
        type: "BASIC_ANNUAL",
        description: "Max 5 active projects, 1 dynamic dashboard page",
        price: 9786 * 12, // 12 months, no discount
        durationInDays: 365,
      },
      {
        name: "Premium User - Monthly",
        type: "PREMIUM_MONTHLY",
        description: "Max 15 active projects, 5 dynamic dashboard pages",
        price: 21786,
        durationInDays: 30,
      },
      {
        name: "Premium User - Annual",
        type: "PREMIUM_ANNUAL",
        description: "Max 15 active projects, 5 dynamic dashboard pages",
        price: 21786 * 12,
        durationInDays: 365,
      },
      {
        name: "Advance User - Monthly",
        type: "ADVANCE_MONTHLY",
        description: "Unlimited projects, all features available",
        price: 101786,
        durationInDays: 30,
      },
      {
        name: "Advance User - Annual",
        type: "ADVANCE_ANNUAL",
        description: "Unlimited projects, all features available",
        price: 101786 * 12,
        durationInDays: 365,
      },
    ],
  })

  console.log("✅ Subscription plans seeded successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
