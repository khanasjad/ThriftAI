import { getServerSession } from 'next-auth/next'
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  // Note: No adapter needed for JWT sessions
  providers: [
    // Only add Google provider if credentials are available
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })]
      : []),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          },
          include: {
            buyer: true
          }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash || ''
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          firstName: user.firstName,
          lastName: user.lastName,
          image: user.image,
          buyer: user.buyer ? {
            id: user.buyer.id,
            buyerType: user.buyer.buyerType,
            isActive: user.buyer.isActive
          } : null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.buyer = user.buyer
        token.firstName = user.firstName
        token.lastName = user.lastName
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.buyer = token.buyer as any
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
      }
      return session
    },
    async signIn({ user, account }) {
      // For credentials provider, sign-in is handled in authorize()
      // Google OAuth would require an adapter to work properly
      return true
    }
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup'
  },
  secret: process.env.NEXTAUTH_SECRET || 'dev-secret-key-change-in-production'
}

export async function getSession() {
  return await getServerSession(authOptions)
}

export async function getCurrentUser() {
  const session = await getSession()
  return session?.user
}

export async function getCurrentBuyer() {
  const session = await getSession()
  return session?.user?.buyer
}