import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ReportIssuePage from './pages/ReportIssuePage';
import MyReportsPage from './pages/MyReportsPage';
import IssueDetailPage from './pages/IssueDetailPage';
import AdminReviewQueuePage from './pages/AdminReviewQueuePage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import WorkerDashboardPage from './pages/WorkerDashboardPage';
import ConfigCatalogPage from './pages/ConfigCatalogPage';
import ForbiddenPage from './pages/ForbiddenPage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-teal-500 selection:text-slate-950 font-sans">
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/catalog" element={<ConfigCatalogPage />} />
              <Route
                path="/report-issue"
                element={
                  <RoleRoute allowedRoles={['citizen', 'super_admin']}>
                    <ReportIssuePage />
                  </RoleRoute>
                }
              />
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
              <Route
                path="/issues/:id"
                element={
                  <ProtectedRoute>
                    <IssueDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/forbidden" element={<ForbiddenPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </SocketProvider>
  </AuthProvider>
);
}
