import { getServerSession } from 'next-auth/next'
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
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
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        // Auto-create buyer profile for Google sign-ins
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { buyer: true }
        })

        if (existingUser && !existingUser.buyer) {
          // Create buyer profile if it doesn't exist
          await prisma.buyer.create({
            data: {
              id: `buyer_${existingUser.id}`,
              userId: existingUser.id,
              firstName: user.firstName || user.name?.split(' ')[0] || 'User',
              lastName: user.lastName || user.name?.split(' ')[1] || '',
              email: user.email!,
              buyerType: 'CASUAL',
              isActive: true,
              emailVerified: true
            }
          })
        }
      }
      return true
    }
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup'
  }
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