import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/contexts/theme-context";
import Dashboard from "@/pages/dashboard";
import AwarenessSessions from "@/pages/awareness-sessions";
import ChildScreening from "@/pages/child-screening";
import UserManagement from "@/pages/user-management";
import FieldTracking from "@/pages/field-tracking";
import ExportData from "@/pages/export-data";
import Login from "@/pages/login";
import Blog from "@/pages/blog";
import BlogPost from "@/pages/blog-post";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout";
import ProtectedRoute from "@/components/protected-route";
import NetworkStatus from "@/components/ui/network-status";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/login" component={Login} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:id" component={BlogPost} />
      
      {/* Protected Routes - All users can access these */}
      <Route path="/">
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/awareness-sessions">
        <ProtectedRoute>
          <Layout>
            <AwarenessSessions />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/child-screening">
        <ProtectedRoute>
          <Layout>
            <ChildScreening />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      {/* Admin Routes - Only developer and master roles can access */}
      <Route path="/users">
        <ProtectedRoute roles={["developer", "master"]}>
          <Layout>
            <UserManagement />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/field-tracking">
        <ProtectedRoute roles={["developer", "master"]}>
          <Layout>
            <FieldTracking />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/export-data">
        <ProtectedRoute roles={["developer", "master"]}>
          <Layout>
            <ExportData />
          </Layout>
        </ProtectedRoute>
      </Route>

      {/* Blog management route for developers */}
      <Route path="/blog/new">
        <ProtectedRoute roles={["developer"]}>
          <Layout>
            <Blog />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router />
          <NetworkStatus />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
