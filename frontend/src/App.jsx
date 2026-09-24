import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import AppLayout from './components/layout/AppLayout';
import { LoginPage, SignupPage } from './pages/auth/AuthPages';
import OnboardPage from './pages/auth/OnboardPage';

import LearnerDashboard from './pages/learner/DashboardPage';
import JobBoardPage from './pages/learner/JobBoardPage';
import AppliedJobsPage from './pages/learner/AppliedJobsPage';
import MarketPulsePage from './pages/learner/MarketPulsePage';
import PathsPage from './pages/learner/PathsPage';
import PathDetailPage from './pages/learner/PathDetailPage';
import CredentialsPage from './pages/learner/CredentialsPage';
import RoleReadinessPage from './pages/learner/RoleReadinessPage';

import {
  EmployerDashboard,
  EmployerPostJobPage,
  EmployerApplicantsPage,
  EmployerAnalyticsPage,
} from './pages/employer/EmployerPages';
import TalentSearchPage from './pages/employer/TalentSearchPage';

import PublicVerifyPage from './pages/verify/PublicVerifyPage';
import { useAuthStore } from './store/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function HomeRedirect() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'employer') return <Navigate to="/employer" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              color: '#f0f0f0',
              border: '1px solid #2e2e2e',
              fontFamily: "'Inter', sans-serif",
              fontSize: '13px',
            },
            success: {
              iconTheme: {
                primary: '#e8ff47',
                secondary: '#000',
              },
            },
          }}
        />

        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify/:credId" element={<PublicVerifyPage />} />
          <Route path="/credentials/verify/:credId" element={<PublicVerifyPage />} />

          {/* Onboarding Flow */}
          <Route path="/onboard" element={<OnboardPage />} />

          {/* Home Redirect */}
          <Route path="/" element={<HomeRedirect />} />

          {/* App Shell (Protected) */}
          <Route element={<AppLayout />}>
            {/* Learner Routes */}
            <Route path="/dashboard" element={<LearnerDashboard />} />
            <Route path="/jobs" element={<JobBoardPage />} />
            <Route path="/applied" element={<AppliedJobsPage />} />
            <Route path="/market-pulse" element={<MarketPulsePage />} />
            <Route path="/paths" element={<PathsPage />} />
            <Route path="/paths/:id" element={<PathDetailPage />} />
            <Route path="/credentials" element={<CredentialsPage />} />
            <Route path="/readiness" element={<RoleReadinessPage />} />

            {/* Employer Routes */}
            <Route path="/employer" element={<EmployerDashboard />} />
            <Route path="/employer/post" element={<EmployerPostJobPage />} />
            <Route path="/employer/post-job" element={<EmployerPostJobPage />} />
            <Route path="/employer/applicants" element={<EmployerApplicantsPage />} />
            <Route path="/employer/talent" element={<TalentSearchPage />} />
            <Route path="/employer/analytics" element={<EmployerAnalyticsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
