// app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth"
import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { productPrisma } from "@/server/src/services/db"
import { verifyCredentials } from "@/lib/api"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(productPrisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    
    // Credentials Provider - Email & Password Login
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" }
      },
      
      async authorize(credentials) {
        // Validate input
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }
        
        try {
          // Use backend API for authentication
          const user = await verifyCredentials(
            credentials.email,
            credentials.password
          )
          
          // Return user object if authentication successful
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image
          }
        } catch (error) {
          // Log error for debugging
          console.error('[Credentials Provider Error]', error)
          throw error
        }
      }
    })
  ],
  
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  callbacks: {
    async jwt({ token, user, account }) {
      // Add user ID to token on first login
      if (user) {
        token.userId = user.id
      }
      return token
    },
    
    async session({ session, token }) {
      // Add userId to session for frontend use
      if (session.user) {
        (session.user as any).id = token.userId
      }
      return session
    },
  },
  
  debug: process.env.NODE_ENV === "development",
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
