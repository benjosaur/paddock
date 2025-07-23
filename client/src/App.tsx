import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "@aws-amplify/ui-react/styles.css";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Sidebar } from "./components/Sidebar";
import { LandingPage } from "./pages/LandingPage";
import ClientsRoutes from "./routes/ClientsRoutes";
import MpsRoutes from "./routes/MpsRoutes";
import PackageRoutes from "./routes/PackageRoutes";
import MagLogRoutes from "./routes/MagLogRoutes";
import VolunteersRoutes from "./routes/VolunteersRoutes";
import RequestRoutes from "./routes/RequestRoutes";
import { queryClient } from "./utils/trpc";
import { QueryClientProvider } from "@tanstack/react-query";
import ErrorBoundary from "@/components/ErrorBoundary";
import { PaddockUser } from "./types/auth";
import RecordsRoutes from "./routes/RecordsRoutes";
import { Toaster } from "./components/ui/Toaster";
import { Dashboard } from "./pages/Dashboard";

function AppContent() {
  const { user, isLoading, signOut } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100/30">
          <Sidebar user={user} onSignOut={signOut} />
          <main className="flex-1 p-8 overflow-auto">
            <ErrorBoundary
              fallbackRender={(props) => {
                return (
                  <div className="text-red-500">
                    An error occurred: {props.error.message}
                  </div>
                );
              }}
            >
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/packages/*" element={<PackageRoutes />} />
                <Route path="/mag/*" element={<MagLogRoutes />} />
                <Route path="/clients/*" element={<ClientsRoutes />} />
                <Route path="/mps/*" element={<MpsRoutes />} />
                <Route path="/volunteers/*" element={<VolunteersRoutes />} />
                <Route path="/records/*" element={<RecordsRoutes />} />
                <Route path="/requests/*" element={<RequestRoutes />} />
                <Route
                  path="*"
                  element={
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">Page not found</p>
                    </div>
                  }
                />
              </Routes>
            </ErrorBoundary>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

const testCheckUser = async (): Promise<PaddockUser | null> => {
  return {
    givenName: import.meta.env.VITE_DEV_GIVEN_NAME ?? "",
    familyName: import.meta.env.VITE_DEV_FAMILY_NAME ?? "",
    email: import.meta.env.VITE_DEV_EMAIL ?? "",
    role: (import.meta.env.VITE_DEV_ROLE as "Test") ?? "Test",
  };
};

function App() {
  return (
    <AuthProvider
      testCheckUser={
        import.meta.env.MODE === "development" ? testCheckUser : undefined
      }
    >
      <AppContent />
      <Toaster />
    </AuthProvider>
  );
}

export default App;
