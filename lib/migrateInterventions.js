import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function migrate() {
  const activities = await prisma.activity.findMany();

  for (const activity of activities) {
    let intervention = null;
    let subIntervention = null;

    if (activity.intervention) {
      intervention = await prisma.intervention.upsert({
        where: { name: activity.intervention },
        update: {},
        create: { name: activity.intervention },
      });
    }

    if (activity.subIntervention && intervention) {
      subIntervention = await prisma.subIntervention.upsert({
        where: { name: activity.subIntervention },
        update: {},
        create: { name: activity.subIntervention, interventionId: intervention.id },
      });
    }

    await prisma.activity.update({
      where: { id: activity.id },
      data: {
        interventionId: intervention?.id,
        subInterventionId: subIntervention?.id,
      },
    });
  }

  console.log('Migration completed!');
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
