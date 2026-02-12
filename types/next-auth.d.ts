import NextAuth from 'next-auth'
import { JWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email?: string | null
      name?: string | null
      image?: string | null
      organizationId: string
      organizationName: string
      role: string
       backendToken: string
      permissions: {
        id: string
        resource: string
        action: string
        conditions?: any
      }[]
    }
  }

  interface User {
    id: string
    email: string
    name: string
    image?: string
    organizationId: string
    organizationName: string
    role: string
     backendToken: string
    permissions: {
      id: string
      resource: string
      action: string
      conditions?: any
    }[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    email: string
    name: string
    picture?: string
    organizationId: string
    organizationName: string
    role: string
    permissions: {
      id: string
      resource: string
      action: string
      conditions?: any
    }[]
  }
} 

