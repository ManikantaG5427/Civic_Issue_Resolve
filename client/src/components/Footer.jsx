import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50 text-slate-600 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Multi-column navigation links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mb-8">
          <div>
            <h3 className="text-slate-900 font-bold text-xs uppercase tracking-wider mb-3 font-heading">
              Public Services
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/report-issue" className="hover:text-slate-900 transition">
                  Report Civic Issue
                </Link>
              </li>
              <li>
                <Link to="/map" className="hover:text-slate-900 transition">
                  Interactive Civic Map
                </Link>
              </li>
              <li>
                <Link to="/catalog" className="hover:text-slate-900 transition">
                  Category Directory
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-slate-900 font-bold text-xs uppercase tracking-wider mb-3 font-heading">
              Citizens
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/my-reports" className="hover:text-slate-900 transition">
                  My Reports
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-slate-900 transition">
                  Account Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-slate-900 transition">
                  Resident Registration
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-slate-900 font-bold text-xs uppercase tracking-wider mb-3 font-heading">
              Administration
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/admin/review-queue" className="hover:text-slate-900 transition">
                  Triage Review Queue
                </Link>
              </li>
              <li>
                <Link to="/admin/analytics" className="hover:text-slate-900 transition">
                  Municipal Intelligence
                </Link>
              </li>
              <li>
                <Link to="/worker/tasks" className="hover:text-slate-900 transition">
                  Field Worker Console
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-slate-900 font-bold text-xs uppercase tracking-wider mb-3 font-heading">
              Support & Legal
            </h3>
            <ul className="space-y-2">
              <li>
                <a href="mailto:civicissuesolve@gmail.com" className="hover:text-slate-900 transition flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>civicissuesolve@gmail.com</span>
                </a>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-slate-900 transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-slate-900 transition">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-700" />
              CivicResolve
            </span>
            <span>&copy; {currentYear} CivicResolve Municipal Resolution Platform. All rights reserved.</span>
          </div>

          <div className="flex items-center space-x-3">
            <Link to="/privacy" className="hover:underline hover:text-slate-800">
              Privacy
            </Link>
            <span className="text-slate-300">|</span>
            <Link to="/terms" className="hover:underline hover:text-slate-800">
              Terms
            </Link>
            <span className="text-slate-300">|</span>
            <Link to="/map" className="hover:underline hover:text-slate-800">
              Civic Map
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

