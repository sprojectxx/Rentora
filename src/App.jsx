import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/shared/Layout';
import Landing from '@/pages/Landing';
import Browse from '@/pages/Browse';
import PropertyDetail from '@/pages/PropertyDetail';
import StudentDashboard from '@/pages/StudentDashboard';
import OwnerDashboard from '@/pages/OwnerDashboard';
import PropertyForm from '@/pages/PropertyForm';
import Messages from '@/pages/Messages';
import Profile from '@/pages/Profile';
import AdminPanel from '@/pages/AdminPanel';
import Onboarding from '@/pages/Onboarding';
import Login from '@/pages/Login';

const AuthenticatedApp = () => {
    const { isLoadingAuth, navigateToLogin, user } = useAuth();

    // Removed authError since we are handling that via ProtectedRoute and interceptors.

    if (isLoadingAuth) {
        return (
            <div className="fixed inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            </div>
        );
    }

    // Redirect new users to onboarding if not onboarded yet
    const needsOnboarding = user && !user.onboarded && window.location.pathname !== '/onboarding';

    if (needsOnboarding) {
        return (
            <Routes>
                <Route path="*" element={<Onboarding />} />
            </Routes>
        );
    }

    return (
        <Routes>
            <Route path="/onboarding" element={
                <ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />}>
                    <Onboarding />
                </ProtectedRoute>
            } />
            <Route element={<Layout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Landing />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/property/:id" element={<PropertyDetail />} />
                <Route path="/dashboard" element={<StudentDashboard />} />
                <Route path="/owner" element={<OwnerDashboard />} />
                <Route path="/owner/new" element={<PropertyForm />} />
                <Route path="/owner/edit/:id" element={<PropertyForm />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="*" element={<PageNotFound />} />
            </Route>
        </Routes>
    );
};

function App() {
    return (
        <AuthProvider>
            <QueryClientProvider client={queryClientInstance}>
                <Router>
                    <AuthenticatedApp />
                </Router>
                <Toaster />
            </QueryClientProvider>
        </AuthProvider>
    )
}

export default App