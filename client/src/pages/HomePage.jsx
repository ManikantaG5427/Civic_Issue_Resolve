import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  MapPin,
  Camera,
  Clock,
  CheckCircle2,
  HardHat,
  Search,
  ArrowRight,
  Layers,
  Mail,
  Zap,
  Activity,
  CheckCircle,
} from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [ticketQuery, setTicketQuery] = useState('');
  const [activeStep, setActiveStep] = useState(0);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!ticketQuery.trim()) return;
    navigate(`/issues/${ticketQuery.trim()}`);
  };

  const workflowSteps = [
    {
      id: 'capture',
      stepNumber: '01',
      title: 'Citizen Capture',
      tagline: 'Instant GPS & High-Definition Photo Evidence',
      detail:
        'Citizens document civic issues on site in under 30 seconds. The native camera module embeds high-precision GPS coordinates, and spatial intelligence automatically flags duplicate submissions within a 50-meter radius.',
      icon: Camera,
      metricLabel: 'Capture Speed',
      metricValue: '< 30 Seconds',
      badge: 'Location Geotagged',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    {
      id: 'triage',
      stepNumber: '02',
      title: 'SLA Engine',
      tagline: 'Instant Automated Department Dispatch',
      detail:
        'Reports enter the triage queue with strict municipal Service Level Agreements. High-priority hazards trigger immediate SMS/Email dispatch to designated zonal engineers and field supervisors.',
      icon: Clock,
      metricLabel: 'Routing Latency',
      metricValue: 'Real-Time Sync',
      badge: 'SLA: 12–48 Hours',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    },
    {
      id: 'dispatch',
      stepNumber: '03',
      title: 'Field Execution',
      tagline: 'Direct Route Navigation & 3-Phase Work Orders',
      detail:
        'Assigned field teams receive route navigation, safety briefs, citizen photos, and live task status directly on their mobile consoles for rapid on-site resolution.',
      icon: HardHat,
      metricLabel: 'Execution Model',
      metricValue: '3-Phase Protocol',
      badge: 'Field Dispatched',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    {
      id: 'verify',
      stepNumber: '04',
      title: 'Verified Closure',
      tagline: 'Dual Photographic Audit & Resident Rating',
      detail:
        'Field workers submit verified completion photos before closure. The citizen who reported the issue reviews the repair and provides a 5-star quality rating before public ticket archive.',
      icon: CheckCircle2,
      metricLabel: 'Audit Standard',
      metricValue: '100% Photo Verified',
      badge: 'Audited & Resolved',
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
    },
  ];

  const slaCategories = [
    {
      name: 'Hazardous Electrical & Signals',
      sla: '24 Hours',
      department: 'Electrical Infrastructure',
      description: 'Exposed live cables, junction box damage, and street lighting failures.',
      badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
    },
    {
      name: 'Road Hazards & Major Potholes',
      sla: '48 Hours',
      department: 'Road & Transit Engineering',
      description: 'Deep road craters, broken asphalt, missing storm drain lids, and curb damage.',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    {
      name: 'Water Supply Pipeline Leaks',
      sla: '12 Hours',
      department: 'Municipal Water Board',
      description: 'High-pressure pipeline bursts, roadway flooding, and potable supply contamination.',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    },
    {
      name: 'Sanitation & Solid Waste',
      sla: '48 Hours',
      department: 'Sanitation & Public Health',
      description: 'Overflowing public dumpsters, illegal debris dumping, and sanitary hazards.',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
  ];

  return (
    <div className="space-y-14 sm:space-y-20 py-4 max-w-5xl mx-auto px-4 sm:px-6">
      {/* 1. HERO SECTION */}
      <section className="text-center pt-4 sm:pt-8 pb-2 space-y-5">
        {/* Subtle, Clean Live Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-black/[0.08] text-xs font-semibold text-[#1D1D1F] shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#34C759]"></span>
          <span className="text-[#86868B] font-mono text-[11px] uppercase tracking-wider">CIVIC RESOLVE</span>
          <span className="text-black/20">•</span>
          <span className="text-[#1D1D1F] font-medium text-[11px]">Municipal Resolution Network</span>
        </div>

        {/* Hero Title */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#1D1D1F] max-w-3xl mx-auto leading-[1.1]">
            Civic Issue Resolution.
          </h1>
          <p className="text-xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-[#0071E3]">
            Faster. Transparent. Accountable.
          </p>
        </div>

        {/* Hero Subtitle */}
        <p className="text-sm sm:text-base text-[#6E6E73] max-w-xl mx-auto leading-relaxed">
          Report municipal defects with geo-tagged photographic proof in 30 seconds. Track field crew dispatch with verified GPS coordinates and live SLA turnaround.
        </p>

        {/* Action Buttons (Human-Designed Capsule Styling) */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/report-issue"
            className="ios-btn-primary px-6 py-3 text-sm font-semibold rounded-full shadow-sm hover:shadow transition active:scale-95"
          >
            Report an Issue
          </Link>

          <Link
            to="/map"
            className="ios-btn-secondary px-6 py-3 text-sm font-semibold rounded-full border border-black/[0.08] hover:bg-black/[0.04] transition active:scale-95"
          >
            Explore Civic Map
          </Link>

          <a
            href="mailto:civicissuesolve@gmail.com"
            className="inline-flex items-center gap-1.5 px-4 py-3 rounded-full text-xs font-semibold text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.04] transition"
          >
            <Mail className="w-4 h-4 text-[#86868B]" />
            <span>Contact Support</span>
          </a>
        </div>

        {/* Clean Ticket Activity Preview Card */}
        <div className="pt-4 max-w-lg mx-auto">
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-black/[0.08] shadow-sm text-left space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-black/[0.05] border border-black/[0.06] flex items-center justify-center text-[#1D1D1F]">
                  <Activity className="w-4 h-4 text-[#0071E3]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1D1D1F]">Ticket #CIVIC-2026-8841</div>
                  <div className="text-[10px] text-[#86868B] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#86868B]" />
                    <span>Sector 4 North Corridor • Geotagged</span>
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                In Progress
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-medium text-[#86868B]">
                <span className="text-[#0071E3] font-semibold">Phase 2: Crew On-Site</span>
                <span className="font-mono text-[#1D1D1F]">SLA: 18h Remaining</span>
              </div>
              <div className="w-full bg-black/[0.06] rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#0071E3] h-1.5 rounded-full w-2/3 transition-all duration-500"></div>
              </div>
            </div>

            <div className="pt-2 border-t border-black/[0.05] flex items-center justify-between text-[11px] text-[#86868B]">
              <span className="flex items-center gap-1 text-[#34C759] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Photo Verified</span>
              </span>
              <span className="font-mono text-[10px] text-[#86868B]">GPS: 37.7749° N, 122.4194° W</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THREE CORE PILLARS (Clean, Human-Designed Cards) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-3xl bg-white border border-black/[0.07] shadow-sm hover:border-black/[0.14] transition-all space-y-3">
          <div className="w-10 h-10 rounded-xl bg-black/[0.04] text-[#1D1D1F] border border-black/[0.06] flex items-center justify-center">
            <Camera className="w-5 h-5 text-[#0071E3]" />
          </div>
          <h3 className="text-base font-bold text-[#1D1D1F]">Geo-Tagged Evidence</h3>
          <p className="text-xs sm:text-sm text-[#6E6E73] leading-relaxed">
            Attach photo proof with auto-detected GPS coordinates. Built-in spatial intelligence detects duplicate submissions within 50 meters automatically.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-black/[0.07] shadow-sm hover:border-black/[0.14] transition-all space-y-3">
          <div className="w-10 h-10 rounded-xl bg-black/[0.04] text-[#1D1D1F] border border-black/[0.06] flex items-center justify-center">
            <Zap className="w-5 h-5 text-[#0071E3]" />
          </div>
          <h3 className="text-base font-bold text-[#1D1D1F]">Automated SLA Engine</h3>
          <p className="text-xs sm:text-sm text-[#6E6E73] leading-relaxed">
            Issues route directly to assigned municipal departments with guaranteed turnaround deadlines and real-time supervisor escalation notifications.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-black/[0.07] shadow-sm hover:border-black/[0.14] transition-all space-y-3">
          <div className="w-10 h-10 rounded-xl bg-black/[0.04] text-[#1D1D1F] border border-black/[0.06] flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-[#0071E3]" />
          </div>
          <h3 className="text-base font-bold text-[#1D1D1F]">Verified Photo Closure</h3>
          <p className="text-xs sm:text-sm text-[#6E6E73] leading-relaxed">
            Field workers submit completion photos for audit. Citizens rate the repair and verify the fix before the ticket is officially closed.
          </p>
        </div>
      </section>

      {/* 3. OPERATIONAL WORKFLOW */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <div className="text-xs font-bold uppercase tracking-wider text-[#0071E3]">
            Lifecycle Workflow
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1F] tracking-tight">
            From citizen report to verified fix.
          </h2>
          <p className="text-xs sm:text-sm text-[#6E6E73]">
            Every step is recorded with geographic precision, automated SLA tracking, and side-by-side photographic proof.
          </p>
        </div>

        {/* Clean Segmented Control Tabs */}
        <div className="flex justify-center">
          <div className="ios-segmented-control flex-wrap justify-center p-1 bg-black/[0.05] rounded-2xl">
            {workflowSteps.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(idx)}
                className={`ios-segment-btn px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeStep === idx ? 'active bg-white text-[#1D1D1F] shadow-sm' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
              >
                <span>{step.stepNumber}. {step.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Active Step Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-black/[0.08] shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-7 space-y-4">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${workflowSteps[activeStep].badgeColor}`}>
                {workflowSteps[activeStep].badge}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-[#1D1D1F]">
                {workflowSteps[activeStep].tagline}
              </h3>
              <p className="text-xs sm:text-sm text-[#6E6E73] leading-relaxed">
                {workflowSteps[activeStep].detail}
              </p>

              <div className="pt-3 flex items-center gap-6 border-t border-black/[0.06]">
                <div>
                  <div className="text-[11px] text-[#86868B] font-medium">{workflowSteps[activeStep].metricLabel}</div>
                  <div className="text-base font-extrabold text-[#1D1D1F] font-mono">{workflowSteps[activeStep].metricValue}</div>
                </div>
              </div>
            </div>

            <div className="md:col-span-5 bg-[#F5F5F7] rounded-2xl border border-black/[0.06] p-5 space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#86868B]">
                Live Resolution Standard
              </div>
              <div className="p-3.5 bg-white rounded-xl border border-black/[0.06] space-y-1.5 shadow-sm">
                <div className="text-xs font-bold text-[#1D1D1F] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#34C759]" />
                  <span>Geographic Spatial Verification</span>
                </div>
                <div className="text-xs font-mono text-[#6E6E73] bg-[#F5F5F7] p-2 rounded-lg border border-black/[0.04]">
                  GPS Radius Match: Exact location verified
                </div>
              </div>
              <div className="text-[11px] text-[#86868B] flex items-center justify-between">
                <span>Cryptographically Timestamped</span>
                <span className="text-[#34C759] font-semibold">• Active</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. TRANSPARENT SERVICE LEVEL AGREEMENTS */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <div className="text-xs font-bold uppercase tracking-wider text-[#0071E3]">
            Accountability
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1F] tracking-tight">
            Transparent Municipal SLA Targets
          </h2>
          <p className="text-xs sm:text-sm text-[#6E6E73]">
            Every civic category operates under defined municipal resolution targets with automated supervisor escalation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {slaCategories.map((cat, idx) => (
            <div
              key={idx}
              className="p-5 sm:p-6 rounded-3xl bg-white border border-black/[0.07] shadow-sm hover:border-black/[0.14] transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider">
                    {cat.department}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${cat.badgeColor}`}>
                    Target: {cat.sla}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#1D1D1F]">{cat.name}</h3>
                <p className="text-xs sm:text-sm text-[#6E6E73] leading-relaxed">
                  {cat.description}
                </p>
              </div>

              <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between text-xs">
                <span className="text-[#86868B]">Escalation: Supervisor notice</span>
                <Link to="/report-issue" className="text-[#0071E3] font-semibold hover:underline flex items-center gap-1">
                  Report &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. TICKET SEARCH BAR */}
      <section className="p-6 sm:p-8 rounded-3xl bg-white border border-black/[0.08] text-center space-y-4 shadow-sm">
        <div className="max-w-xl mx-auto space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1D1D1F]">
            Track a specific civic ticket
          </h2>
          <p className="text-xs sm:text-sm text-[#6E6E73]">
            Enter your ticket ID to inspect real-time progress, crew dispatch logs, and photo verification.
          </p>
        </div>

        <form onSubmit={handleSearch} className="max-w-md mx-auto flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={ticketQuery}
            onChange={(e) => setTicketQuery(e.target.value)}
            placeholder="e.g. CIVIC-2026-XXXXX"
            className="flex-1 text-xs sm:text-sm font-mono py-2.5 px-4 rounded-xl bg-[#F5F5F7] text-[#1D1D1F] placeholder-[#86868B] border border-black/[0.08] outline-none focus:ring-2 focus:ring-[#0071E3] focus:bg-white transition"
            aria-label="Issue Ticket ID"
          />
          <button
            type="submit"
            className="py-2.5 px-5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white font-semibold text-xs sm:text-sm transition shadow-sm active:scale-95 shrink-0"
          >
            Lookup
          </button>
        </form>

        <div className="text-xs text-[#86868B] pt-1">
          <span>Or explore the public map: </span>
          <Link to="/map" className="text-[#0071E3] hover:underline font-semibold">
            Interactive Civic Map &rarr;
          </Link>
        </div>
      </section>

      {/* 6. BOTTOM CALL TO ACTION */}
      <section className="text-center py-4 space-y-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1F] tracking-tight">
          Help build a cleaner, safer city.
        </h2>
        <p className="text-xs sm:text-sm text-[#6E6E73] max-w-md mx-auto">
          Submit defects in under 30 seconds. Real-time updates delivered to your device.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to="/report-issue"
            className="ios-btn-primary px-6 py-3 text-sm font-semibold rounded-full shadow-sm"
          >
            Submit an Issue Now
          </Link>
          <Link
            to="/catalog"
            className="ios-btn-secondary px-6 py-3 text-sm font-semibold rounded-full border border-black/[0.08]"
          >
            View Category Directory
          </Link>
        </div>
      </section>
    </div>
  );
}


