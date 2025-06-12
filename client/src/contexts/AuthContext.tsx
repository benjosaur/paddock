import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { fetchAuthSession, signOut } from "aws-amplify/auth";
import { PaddockUser } from "@/types/auth";
import { UserRole, userRoleSchema } from "shared";

interface AuthContextType {
  user: PaddockUser | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<PaddockUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const session = await fetchAuthSession();
      const idTokenPayload = session.tokens?.idToken?.payload;

      if (!idTokenPayload)
        throw new Error(
          `Missing Id Token. Session: ${JSON.stringify(session)}`
        );

      const givenName = idTokenPayload["given_name"] as string;
      const familyName = idTokenPayload["family_name"] as string;
      const email = idTokenPayload["email"] as string;
      const role = Array.isArray(idTokenPayload["cognito:groups"])
        ? (idTokenPayload["cognito:groups"][0] as UserRole)
        : undefined;

      if (!givenName || typeof givenName !== "string")
        throw new Error(
          `Error processing Given Name. Payload: ${JSON.stringify(
            idTokenPayload
          )}`
        );
      if (!familyName || typeof familyName !== "string")
        throw new Error(
          `Error processing Family Name. Payload: ${JSON.stringify(
            idTokenPayload
          )}`
        );
      if (!email || typeof email !== "string")
        throw new Error(
          `Error processing Email. Payload: ${JSON.stringify(idTokenPayload)}`
        );
      if (!role || !userRoleSchema.options.includes(role))
        throw new Error(
          `Error processing Role. Payload: ${JSON.stringify(idTokenPayload)}`
        );

      setUser({
        givenName,
        familyName,
        email,
        role,
      });
    } catch (error) {
      console.warn("Error fetching authenticated user:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut: handleSignOut }}>
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
