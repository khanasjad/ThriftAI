import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      firstName: string
      lastName: string
      image?: string
      buyer?: {
        id: string
        buyerType: string
        isActive: boolean
      }
    }
  }

  interface User {
    id: string
    email: string
    name: string
    firstName?: string
    lastName?: string
    image?: string
    buyer?: {
      id: string
      buyerType: string
      isActive: boolean
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    buyer?: {
      id: string
      buyerType: string
      isActive: boolean
    }
    firstName?: string
    lastName?: string
  }
}