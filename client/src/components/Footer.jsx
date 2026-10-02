import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-[#D2D2D7] bg-[#F5F5F7] text-[#6E6E73] text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Footnote disclaimer */}
        <div className="pb-8 mb-8 border-b border-[#E5E5E7] space-y-2 text-[11px] leading-relaxed">
          <p>
            1. Service Level Agreements (SLAs) reflect target operational benchmarks configured per municipality. Emergency hazards requiring immediate police, fire, or paramedic response should always be reported to local emergency dispatch services directly.
          </p>
          <p>
            2. Interactive lifecycle simulations and sample tickets are clearly designated for demonstration purposes. Live tickets reflect verified municipal database entries.
          </p>
        </div>

        {/* Multi-column navigation links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-[#1D1D1F] font-semibold text-xs mb-3">Public Services</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/report-issue" className="hover:text-[#1D1D1F] hover:underline">
                  Report an Issue
                </Link>
              </li>
              <li>
                <Link to="/map" className="hover:text-[#1D1D1F] hover:underline">
                  Public Civic Map
                </Link>
              </li>
              <li>
                <Link to="/catalog" className="hover:text-[#1D1D1F] hover:underline">
                  Issue Catalog & Categories
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[#1D1D1F] font-semibold text-xs mb-3">Citizens</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/my-reports" className="hover:text-[#1D1D1F] hover:underline">
                  My Submissions
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#1D1D1F] hover:underline">
                  Citizen Account Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-[#1D1D1F] hover:underline">
                  Create Resident Account
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[#1D1D1F] font-semibold text-xs mb-3">Administration</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/admin/review-queue" className="hover:text-[#1D1D1F] hover:underline">
                  Triage Review Queue
                </Link>
              </li>
              <li>
                <Link to="/admin/analytics" className="hover:text-[#1D1D1F] hover:underline">
                  Municipal Analytics
                </Link>
              </li>
              <li>
                <Link to="/worker/tasks" className="hover:text-[#1D1D1F] hover:underline">
                  Field Worker Console
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[#1D1D1F] font-semibold text-xs mb-3">Governance & Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="hover:text-[#1D1D1F] hover:underline">
                  Privacy Policy <span className="text-[10px] text-[#86868B]">(Draft)</span>
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-[#1D1D1F] hover:underline">
                  Terms of Service <span className="text-[10px] text-[#86868B]">(Draft)</span>
                </Link>
              </li>
              <li>
                <span className="text-[#86868B]">API v1.0 &bull; REST &bull; Socket.io</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-[#E5E5E7] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="font-semibold text-[#1D1D1F]">CivicResolve</span>
            <span className="text-[#86868B]">&copy; {currentYear} CivicResolve Public Infrastructure Platform. All rights reserved.</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px]">
            <Link to="/privacy" className="hover:underline hover:text-[#1D1D1F]">
              Privacy
            </Link>
            <span className="text-[#D2D2D7]">|</span>
            <Link to="/terms" className="hover:underline hover:text-[#1D1D1F]">
              Terms of Use
            </Link>
            <span className="text-[#D2D2D7]">|</span>
            <Link to="/map" className="hover:underline hover:text-[#1D1D1F]">
              Civic Map
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
