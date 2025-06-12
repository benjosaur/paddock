import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  getCurrentUser,
  AuthUser,
  signOut,
  fetchUserAttributes,
} from "aws-amplify/auth";
import type { UserRole } from "../types";
import { userRoleSchema } from "shared";

interface AuthContextType {
  user: AuthUser | null;
  userRole: UserRole | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const getRoleFromUser = async (user: AuthUser): Promise<UserRole> => {
  const attributes = await fetchUserAttributes();
  if (!userRoleSchema.options.includes(user.signInDetails?.["custom:role"])) {
    throw new Error(`Invalid or missing custom:role attribute`);
  }
  return customRole;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setUserRole(getRoleFromUser(currentUser));
    } catch (error) {
      setUser(null);
      setUserRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      setUserRole(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, userRole, isLoading, signOut: handleSignOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
