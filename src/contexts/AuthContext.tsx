import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface AuthUser {
  name: string | null;
  email: string | null;
  image?: string | null;
  accessToken: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (session?.user) {
      setUser({
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        accessToken: session.accessToken as string,
      });
    } else {
      setUser(null);
    }
  }, [session]);

  const value = {
    user,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
