import NextAuth, { NextAuthOptions, Session, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";

// Define the user data structure returned from your backend
interface BackendUser {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  // Add other user properties from your backend as needed
}

// Define the structure of the user data in the session
interface CustomUser extends User {
  id: string;
  email: string;
  name: string;
  accessToken: string;
  // Add any other user properties you want to include in the session
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
    accessToken?: string; // Add accessToken to the session
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

          // Call your Express backend to authenticate the user
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
            // Use accessToken if available, otherwise check for token
            const token = data.accessToken || data.token;
            if (!token) {
              throw new Error("No token received from backend");
            }
            // Return the user object to be stored in the session
            return {
              id: data.user._id,
              email: data.user.username,
              name: `${data.user.firstName} ${data.user.lastName}`,
              accessToken: token, // Use the actual token from the backend
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
    signIn: "/login", // Custom login page
  },
  session: {
    strategy: "jwt", // Use JWT for session management
  },
  callbacks: {
    async jwt({ token, user }): Promise<JWT> {
      console.log("Callback called with token:", token);
      console.log("Callback called with user:", user);

      // If user is present (during sign-in), update the token with user data
      if (user) {
        token.id = user.id;
        token.email = user.email || "";
        token.accessToken = (user as CustomUser).accessToken;
      }

      // Always return the token, whether updated or not
      return token;
    },
    async session({ session, token }): Promise<Session> {
      try {
        // Add user data to the session
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
  secret: process.env.NEXTAUTH_SECRET, // Ensure this is set in your .env
};

// Export the handlers for the App Router
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
