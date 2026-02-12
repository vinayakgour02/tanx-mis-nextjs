import { prisma } from '@/lib/prisma'

export async function getActiveSubscription(organizationId: string) {
  return prisma.organizationSubscription.findFirst({
    where: {
      organizationId,
      isActive: true,
      endDate: { gt: new Date() },
    },
    include: {
      plan: true,
    },
  })
}
