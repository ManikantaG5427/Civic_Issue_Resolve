import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-black/[0.08] bg-[#F5F5F7] text-[#86868B] text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Multi-column navigation links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mb-8">
          <div>
            <h3 className="text-[#1D1D1F] font-semibold text-xs tracking-tight mb-3">
              Public Services
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/report-issue" className="hover:text-[#1D1D1F] transition">
                  Report Civic Issue
                </Link>
              </li>
              <li>
                <Link to="/map" className="hover:text-[#1D1D1F] transition">
                  Interactive Civic Map
                </Link>
              </li>
              <li>
                <Link to="/catalog" className="hover:text-[#1D1D1F] transition">
                  Category Directory
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[#1D1D1F] font-semibold text-xs tracking-tight mb-3">
              Citizens
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/my-reports" className="hover:text-[#1D1D1F] transition">
                  My Reports
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#1D1D1F] transition">
                  Account Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-[#1D1D1F] transition">
                  Resident Registration
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[#1D1D1F] font-semibold text-xs tracking-tight mb-3">
              Administration
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/admin/review-queue" className="hover:text-[#1D1D1F] transition">
                  Triage Review Queue
                </Link>
              </li>
              <li>
                <Link to="/admin/analytics" className="hover:text-[#1D1D1F] transition">
                  Municipal Intelligence
                </Link>
              </li>
              <li>
                <Link to="/worker/tasks" className="hover:text-[#1D1D1F] transition">
                  Field Worker Console
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[#1D1D1F] font-semibold text-xs tracking-tight mb-3">
              Support & Legal
            </h3>
            <ul className="space-y-2">
              <li>
                <a href="mailto:civicissuesolve@gmail.com" className="hover:text-[#1D1D1F] transition flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#86868B]" />
                  <span>civicissuesolve@gmail.com</span>
                </a>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-[#1D1D1F] transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-[#1D1D1F] transition">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-black/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#86868B]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#1D1D1F] flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-[#0071E3]" />
              CivicResolve
            </span>
            <span>&copy; {currentYear} CivicResolve Municipal Resolution Platform. All rights reserved.</span>
          </div>

          <div className="flex items-center space-x-3">
            <Link to="/privacy" className="hover:underline hover:text-[#1D1D1F]">
              Privacy
            </Link>
            <span className="text-black/20">|</span>
            <Link to="/terms" className="hover:underline hover:text-[#1D1D1F]">
              Terms
            </Link>
            <span className="text-black/20">|</span>
            <Link to="/map" className="hover:underline hover:text-[#1D1D1F]">
              Civic Map
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}


