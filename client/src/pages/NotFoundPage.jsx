import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[65vh] flex items-center justify-center py-12 px-4">
      <div className="apple-panel max-w-md w-full text-center p-8 bg-[#FFFFFF] relative overflow-hidden">
        <div className="w-14 h-14 rounded-2xl bg-[#F5F5F7] text-[#1D1D1F] border border-[#E5E5E7] flex items-center justify-center mx-auto mb-5 shadow-sm">
          <FileQuestion className="w-7 h-7 text-[#0071E3]" />
        </div>

        <span className="apple-badge bg-blue-50 text-[#0071E3] border border-blue-200">
          Error 404
        </span>

        <h1 className="text-2xl sm:text-3xl font-semibold text-[#1D1D1F] mt-4 tracking-tight">
          Page Not Found
        </h1>

        <p className="text-sm text-[#6E6E73] mt-3 leading-relaxed">
          The requested civic page or resource does not exist or may have been moved.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/" className="apple-btn-primary w-full sm:w-auto text-sm gap-2">
            <Home className="w-4 h-4" />
            <span>Return Home</span>
          </Link>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="apple-btn-secondary w-full sm:w-auto text-sm gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
}
