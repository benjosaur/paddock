import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Sidebar } from "./components/Sidebar";
import ClientsRoutes from "./routes/ClientsRoutes";
import MpsRoutes from "./routes/MpsRoutes";
import MpLogRoutes from "./routes/MpLogRoutes";
import MagLogRoutes from "./routes/MagLogRoutes";
import VolunteerLogRoutes from "./routes/VolunteerLogRoutes";
import VolunteersRoutes from "./routes/VolunteersRoutes";
import ClientRequestRoutes from "./routes/ClientRequestRoutes";
import ExpiriesRoutes from "./routes/ExpiriesRoutes";
import { queryClient } from "./utils/trpc";
import { QueryClientProvider } from "@tanstack/react-query";
import ErrorBoundary from "@/components/ErrorBoundary";

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
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">No role assigned</p>
      </div>
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
                <Route path="/" element={<Navigate to="/mp-logs" />} />
                <Route path="/mp-logs/*" element={<MpLogRoutes />} />
                <Route
                  path="/volunteer-logs/*"
                  element={<VolunteerLogRoutes />}
                />
                <Route path="/mag-logs/*" element={<MagLogRoutes />} />
                <Route path="/clients/*" element={<ClientsRoutes />} />
                <Route path="/mps/*" element={<MpsRoutes />} />
                <Route path="/volunteers/*" element={<VolunteersRoutes />} />
                <Route path="/expiries/*" element={<ExpiriesRoutes />} />
                <Route
                  path="/new-requests/*"
                  element={<ClientRequestRoutes />}
                />
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

function App() {
  return (
    <Authenticator>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Authenticator>
  );
}

export default App;
