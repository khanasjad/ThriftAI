import type { DefaultSession } from 'next-auth'
import type { UserRole } from '@/generated/prisma/client'

declare module 'next-auth' {
  interface User {
    role: UserRole
    tenantId: string | null
  }
  interface Session {
    user: DefaultSession['user'] & {
      id: string
      role: UserRole
      tenantId: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: UserRole
    tenantId?: string | null
  }
}
