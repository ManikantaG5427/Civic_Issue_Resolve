import React from 'react';
import { Link } from 'react-router-dom';

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      {/* Draft banner */}
      <div className="mb-8 p-4 bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl text-xs text-[#6E6E73] flex items-center justify-between">
        <span>Draft Document &mdash; Subject to Municipal Counsel and Administrative Review</span>
        <span className="font-semibold text-[#1D1D1F]">Version 1.0 (Draft)</span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-semibold text-[#1D1D1F] tracking-tight mb-4">
        Terms of Service
      </h1>
      <p className="text-sm text-[#86868B] mb-10">
        Effective date: October 2026. Governing public civic issue submissions and platform usage.
      </p>

      <div className="space-y-8 text-sm leading-relaxed text-[#333336]">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[#1D1D1F]">1. Platform Scope and Purpose</h2>
          <p>
            CivicResolve is a public civic issue intake, triage, and resolution platform. It enables residents to submit infrastructure defect reports (including road damage, lighting outages, water leaks, and sanitation concerns) to municipal authorities and authorized field contractors.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[#1D1D1F]">2. User Submissions & Evidence Accuracy</h2>
          <p>
            When submitting an issue report, users agree to provide truthful descriptions, accurate photographic evidence, and authentic location coordinates. Submitting intentionally fraudulent reports, defamatory comments, or non-civic media is prohibited.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[#1D1D1F]">3. Emergency Situations</h2>
          <p className="font-medium text-[#1D1D1F]">
            CivicResolve is NOT an emergency dispatch service. For life-threatening emergencies, immediate fire hazards, gas leaks, or crimes in progress, call local emergency services (e.g., 911 / 112) immediately.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[#1D1D1F]">4. Public Visibility and Data Transparency</h2>
          <p>
            To maintain community accountability, issue descriptions, photographic evidence, and resolution statuses are published on the Public Civic Map. Personal identification (phone numbers, full names, and exact private residential unit numbers) is redacted or restricted to authorized administrative personnel.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[#1D1D1F]">5. Service Level Commitments (SLAs)</h2>
          <p>
            Target resolution timelines (e.g., 24-hour streetlight repair, 48-hour pothole patching) are operational benchmarks published for transparency. Actual resolution times may vary based on weather conditions, contractor capacity, and emergency priority shifts.
          </p>
        </section>

        <div className="pt-8 border-t border-[#E5E5E7] flex items-center justify-between text-xs text-[#86868B]">
          <Link to="/" className="text-[#0071E3] hover:underline">
            &larr; Back to CivicResolve
          </Link>
          <Link to="/privacy" className="text-[#0071E3] hover:underline">
            View Privacy Policy &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
