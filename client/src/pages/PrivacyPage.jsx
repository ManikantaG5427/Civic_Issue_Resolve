import React from 'react';
import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      {/* Draft banner */}
      <div className="mb-8 p-4 bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl text-xs text-[#6E6E73] flex items-center justify-between">
        <span>Draft Document &mdash; Subject to Municipal Privacy Officer Review</span>
        <span className="font-semibold text-[#1D1D1F]">Version 1.0 (Draft)</span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-semibold text-[#1D1D1F] tracking-tight mb-4">
        Privacy Policy
      </h1>
      <p className="text-sm text-[#86868B] mb-10">
        How CivicResolve collects, protects, and handles civic location data and user information.
      </p>

      <div className="space-y-8 text-sm leading-relaxed text-[#333336]">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[#1D1D1F]">1. Information We Collect</h2>
          <p>
            When you register or submit a civic report, we collect:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#555558]">
            <li>Account credentials (name, email address, contact number).</li>
            <li>Issue location coordinates (latitude and longitude via device GPS or manual map pin).</li>
            <li>Uploaded photographs and optional EXIF timestamp/geotag metadata.</li>
            <li>Community feedback, upvotes, and public comments on existing issues.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[#1D1D1F]">2. How Location Data Is Used</h2>
          <p>
            Location coordinates are required to display defect reports on the Public Civic Map, calculate routing for field maintenance crews, and detect duplicate submissions within a 50-meter radius. We do not track your location in the background when the app is closed.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[#1D1D1F]">3. Data Sharing & Municipal Contractors</h2>
          <p>
            Issue details and work orders are shared with verified municipal departments and authorized maintenance contractors exclusively to inspect and resolve reported defects. We do not sell personal data to third-party advertisers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[#1D1D1F]">4. Security & Cryptographic Access</h2>
          <p>
            Administrative and field worker actions require role-based token authentication (JWT). Tamper-proof audit logs record state transitions (e.g., triage status changes, dispatch assignments, and completion approvals).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[#1D1D1F]">5. Data Retention & Citizen Rights</h2>
          <p>
            Citizens may request account deletion or export their submission history at any time through the Profile Settings. Public issue history remains in the civic ledger with personal identity de-identified.
          </p>
        </section>

        <div className="pt-8 border-t border-[#E5E5E7] flex items-center justify-between text-xs text-[#86868B]">
          <Link to="/" className="text-[#0071E3] hover:underline">
            &larr; Back to CivicResolve
          </Link>
          <Link to="/terms" className="text-[#0071E3] hover:underline">
            View Terms of Service &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
