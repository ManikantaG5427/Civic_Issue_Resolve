import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import HoverableSidebar from './components/HoverableSidebar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import InactivityGuard from './components/common/InactivityGuard';
import { Loader2 } from 'lucide-react';

// Robust lazy import with automatic cache recovery on redeployment
function lazyWithRetry(componentImport) {
  return lazy(async () => {
    const isRefreshed = sessionStorage.getItem('chunk_retry');
    try {
      const component = await componentImport();
      sessionStorage.removeItem('chunk_retry');
      return component;
    } catch (error) {
      if (!isRefreshed) {
        sessionStorage.setItem('chunk_retry', 'true');
        window.location.reload();
        return;
      }
      throw error;
    }
  });
}

// Code-split route pages with auto-healing dynamic imports
const HomePage = lazyWithRetry(() => import('./pages/HomePage'));
const LoginPage = lazyWithRetry(() => import('./pages/LoginPage'));
const RegisterPage = lazyWithRetry(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazyWithRetry(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazyWithRetry(() => import('./pages/ResetPasswordPage'));
const DashboardPage = lazyWithRetry(() => import('./pages/DashboardPage'));
const ReportIssuePage = lazyWithRetry(() => import('./pages/ReportIssuePage'));
const MyReportsPage = lazyWithRetry(() => import('./pages/MyReportsPage'));
const IssueDetailPage = lazyWithRetry(() => import('./pages/IssueDetailPage'));
const AdminReviewQueuePage = lazyWithRetry(() => import('./pages/AdminReviewQueuePage'));
const AdminAnalyticsPage = lazyWithRetry(() => import('./pages/AdminAnalyticsPage'));
const PublicCivicMapPage = lazyWithRetry(() => import('./pages/PublicCivicMapPage'));
const WorkerDashboardPage = lazyWithRetry(() => import('./pages/WorkerDashboardPage'));
const ConfigCatalogPage = lazyWithRetry(() => import('./pages/ConfigCatalogPage'));
const ForbiddenPage = lazyWithRetry(() => import('./pages/ForbiddenPage'));
const NotFoundPage = lazyWithRetry(() => import('./pages/NotFoundPage'));
const TermsPage = lazyWithRetry(() => import('./pages/TermsPage'));
const PrivacyPage = lazyWithRetry(() => import('./pages/PrivacyPage'));

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 text-[#183827] animate-spin" />
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading CivicResolve...</span>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <InactivityGuard />
            <div className="min-h-screen flex flex-col bg-[#F4F7F4] text-charcoal-900 selection:bg-[#B4D5C2] selection:text-[#183827] font-sans">
              <HoverableSidebar />
              <div className="flex-1 flex flex-col md:pl-20 transition-all duration-300">
                <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/map" element={<PublicCivicMapPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                      <Route path="/catalog" element={<ConfigCatalogPage />} />
                      <Route path="/report-issue" element={<ReportIssuePage />} />
                      <Route
                        path="/my-reports"
                        element={
                          <RoleRoute allowedRoles={['citizen', 'super_admin']}>
                            <MyReportsPage />
                          </RoleRoute>
                        }
                      />
                      <Route
                        path="/admin/review-queue"
                        element={
                          <RoleRoute allowedRoles={['administrator', 'super_admin']}>
                            <AdminReviewQueuePage />
                          </RoleRoute>
                        }
                      />
                      <Route
                        path="/admin/analytics"
                        element={
                          <RoleRoute allowedRoles={['administrator', 'super_admin']}>
                            <AdminAnalyticsPage />
                          </RoleRoute>
                        }
                      />
                      <Route
                        path="/worker/tasks"
                        element={
                          <RoleRoute allowedRoles={['field_worker', 'super_admin']}>
                            <WorkerDashboardPage />
                          </RoleRoute>
                        }
                      />
                      <Route path="/issues/:id" element={<IssueDetailPage />} />
                      <Route
                        path="/dashboard"
                        element={
                          <ProtectedRoute>
                            <DashboardPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/terms" element={<TermsPage />} />
                      <Route path="/privacy" element={<PrivacyPage />} />
                      <Route path="/forbidden" element={<ForbiddenPage />} />
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </Suspense>
                </main>
            <Footer />
          </div>
        </div>
      </BrowserRouter>
    </SocketProvider>
  </AuthProvider>
</ErrorBoundary>
  );
}
