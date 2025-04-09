// src/lib/auth.ts
import { NextAuthOptions, Session, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";
import { randomBytes } from "crypto";

// Define the user data structure returned from your backend
interface BackendUser {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
}

// Define the structure of the user data in the session
interface CustomUser extends User {
  id: string;
  email: string;
  name: string;
  accessToken: string;
}

// Extend the Session type to include user properties
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    accessToken?: string;
  }
}

// Extend the JWT type to include custom properties
declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    email?: string;
    accessToken?: string;
  }
}

// Generate a random state string for OAuth flows
export function generateState(): string {
  return randomBytes(32).toString("hex");
}

// Validate the state parameter (in production, compare against stored state)
export function validateState(state: string | null): boolean {
  if (!state) {
    return false;
  }
  // Add your state validation logic here (e.g., compare with stored state)
  return true;
}

// Validate redirect URI for security
export function isValidRedirectUri(uri: string): boolean {
  try {
    const url = new URL(uri);
    const allowedDomains = [
      "localhost",
      // Add your production domains here (e.g., 'yourdomain.com')
    ];
    return allowedDomains.includes(url.hostname);
  } catch {
    return false;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<CustomUser | null> {
        try {
          if (!credentials?.username || !credentials?.password) {
            throw new Error("Email and password are required");
          }

          const res = await fetch(
            "https://backend-production-5eec.up.railway.app/api/v1/auth/login",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                username: credentials.username,
                password: credentials.password,
              }),
            }
          );

          const data: {
            user: BackendUser;
            accessToken?: string;
            token?: string;
            message?: string;
          } = await res.json();
          console.log("Backend login response:", data);

          if (res.ok && data.user) {
            const token = data.accessToken || data.token;
            if (!token) {
              throw new Error("No token received from backend");
            }
            return {
              id: data.user._id,
              email: data.user.username,
              name: `${data.user.firstName} ${data.user.lastName}`,
              accessToken: token,
              ...data.user,
            };
          } else {
            throw new Error(data.message || "Authentication failed");
          }
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }): Promise<JWT> {
      console.log("Callback called with token:", token);
      console.log("Callback called with user:", user);
      if (user) {
        token.id = user.id;
        token.email = user.email || "";
        token.accessToken = (user as CustomUser).accessToken;
      }
      return token;
    },
    async session({ session, token }): Promise<Session> {
      try {
        if (token) {
          session.user = {
            ...session.user,
            id: token.id as string,
            email: token.email as string,
            name: token.name as string,
          };
          session.accessToken = token.accessToken as string;
        }
        return session;
      } catch (error) {
        console.error("Session callback error:", error);
        return { user: {}, expires: new Date().toISOString() };
      }
    },
  },
  events: {
    async signOut() {
      console.log("User signed out");
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
