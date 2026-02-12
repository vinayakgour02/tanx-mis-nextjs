import { NextAuthOptions } from "next-auth";
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { User } from 'next-auth'
import jwt from 'jsonwebtoken'

const BACKEND_JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET!

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter your email and password')
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            organization: {
              include: {
                subscriptions: true,
              }
            },
            memberships: {
              include: {
                organization: true,
                permissions: true
              }
            }
          }
        })

        if (!user) {
          throw new Error('No user found with this email')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )

        if (!isPasswordValid) {
          throw new Error('Invalid password')
        }

        if (user.status !== 'ACTIVE') {
          throw new Error('Your account is not active')
        }

        const activeMembership = user.memberships.find(m => m.isActive)
        if (!activeMembership) {
          throw new Error('No active organization membership found')
        }

        const isOrganizationSubscribed = user.organization?.subscriptions.some(
          (sub) => sub.isActive && sub.endDate > new Date()
        );

        let activeSubscription: any = null;

        if (isOrganizationSubscribed) {
          const latestSub = user.organization?.subscriptions
            .filter((sub) => sub.isActive && sub.endDate > new Date())
            .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())[0];

          if (latestSub) {
            activeSubscription = await prisma.subscriptionPlan.findUnique({
              where: { id: latestSub.planId },
              select: {
                id: true,
                name: true,
                type: true,
                price: true,
                durationInDays: true,
              },
            });
          }
        }

        if (!isOrganizationSubscribed) {
          throw new Error('Your organization does not have an active subscription!')
        }

        try {
          const headersObj: any = (req as any)?.headers
          const getHeader = (name: string): string | undefined => {
            if (!headersObj) return undefined
            if (typeof headersObj.get === 'function') {
              return headersObj.get(name) || undefined
            }
            const direct = headersObj[name] ?? headersObj[String(name).toLowerCase()]
            if (Array.isArray(direct)) return direct[0]
            return direct as string | undefined
          }
          const forwardedFor = getHeader('x-forwarded-for') ?? ''
          const realIp = getHeader('x-real-ip') ?? ''
          const ipAddress = (typeof forwardedFor === 'string' ? forwardedFor.split(',')[0]?.trim() : '') || realIp || undefined
          const userAgent = getHeader('user-agent') || undefined

          await prisma.auditLog.create({
            data: {
              organizationId: activeMembership.organizationId,
              userId: user.id,
              action: 'LOGIN',
              resource: 'Auth',
              ipAddress,
              userAgent,
              timestamp: new Date(),
            }
          })
        } catch (e) {
          console.error('Failed to write audit log for login', e)
        }
        const backendToken = jwt.sign(
          {
            userId: user.id,
            organizationId: activeMembership.organizationId,
          },
          BACKEND_JWT_SECRET,
          { expiresIn: '7d' }
        )

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          image: user.avatar || undefined,
          organizationId: activeMembership.organizationId,
          organizationName: activeMembership.organization.name,
          role: activeMembership.ngoRole || activeMembership.donorRole || '',
          permissions: activeMembership.permissions,
          subscriptionPlan: activeSubscription,
          backendToken
        } as User;

      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.backendToken = (user as any).backendToken
        token.organizationId = (user as any).organizationId;
        token.organizationName = (user as any).organizationName;
        token.role = (user as any).role;
        token.permissions = (user as any).permissions;
        token.subscriptionPlan = (user as any).subscriptionPlan;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any) = {
          ...session.user,
          id: token.id,
          organizationId: token.organizationId,
          organizationName: token.organizationName,
          role: token.role,
          permissions: token.permissions,
          subscriptionPlan: token.subscriptionPlan,
          backendToken: token.backendToken
        };
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}