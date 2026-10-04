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
  Sparkles,
  Mail,
  Zap,
  Activity,
  CheckCircle,
  Flame,
  Radio,
  Sliders,
  Award,
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
      iconBg: 'bg-gradient-to-b from-[#34C759] to-[#248A3D]',
      metricLabel: 'Capture Speed',
      metricValue: '< 30 Seconds',
      badge: 'Location Geotagged',
      badgeColor: 'bg-[#34C759]/10 text-[#34C759] border-[#34C759]/20',
    },
    {
      id: 'triage',
      stepNumber: '02',
      title: 'SLA Engine',
      tagline: 'Instant Automated Department Dispatch',
      detail:
        'Reports enter the triage queue with strict municipal Service Level Agreements. High-priority hazards trigger immediate SMS/Email dispatch to designated zonal engineers and field supervisors.',
      icon: Clock,
      iconBg: 'bg-gradient-to-b from-[#0071E3] to-[#0051A8]',
      metricLabel: 'Routing Latency',
      metricValue: 'Real-Time Sync',
      badge: 'SLA: 12–48 Hours',
      badgeColor: 'bg-[#0071E3]/10 text-[#0071E3] border-[#0071E3]/20',
    },
    {
      id: 'dispatch',
      stepNumber: '03',
      title: 'Field Execution',
      tagline: 'Direct Route Navigation & 3-Phase Work Orders',
      detail:
        'Assigned field teams receive route navigation, safety briefs, citizen photos, and live task status directly on their mobile consoles for rapid on-site resolution.',
      icon: HardHat,
      iconBg: 'bg-gradient-to-b from-[#FF9500] to-[#C97500]',
      metricLabel: 'Execution Model',
      metricValue: '3-Phase Protocol',
      badge: 'Field Dispatched',
      badgeColor: 'bg-[#FF9500]/10 text-[#FF9500] border-[#FF9500]/20',
    },
    {
      id: 'verify',
      stepNumber: '04',
      title: 'Verified Closure',
      tagline: 'Dual Photographic Audit & Resident Rating',
      detail:
        'Field workers submit verified completion photos before closure. The citizen who reported the issue reviews the repair and provides a 5-star quality rating before public ticket archive.',
      icon: CheckCircle2,
      iconBg: 'bg-gradient-to-b from-[#5856D6] to-[#3B39A0]',
      metricLabel: 'Audit Standard',
      metricValue: '100% Photo Verified',
      badge: 'Audited & Resolved',
      badgeColor: 'bg-[#5856D6]/10 text-[#5856D6] border-[#5856D6]/20',
    },
  ];

  const slaCategories = [
    {
      name: 'Hazardous Electrical & Signals',
      sla: '24 Hours',
      department: 'Electrical Infrastructure',
      description: 'Exposed live cables, junction box damage, and street lighting failures.',
      badgeColor: 'bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/20',
      iconColor: 'from-[#FF3B30] to-[#D72B21]',
    },
    {
      name: 'Road Hazards & Major Potholes',
      sla: '48 Hours',
      department: 'Road & Transit Engineering',
      description: 'Deep road craters, broken asphalt, missing storm drain lids, and curb damage.',
      badgeColor: 'bg-[#FF9500]/10 text-[#FF9500] border-[#FF9500]/20',
      iconColor: 'from-[#FF9500] to-[#C97500]',
    },
    {
      name: 'Water Supply Pipeline Leaks',
      sla: '12 Hours',
      department: 'Municipal Water Board',
      description: 'High-pressure pipeline bursts, roadway flooding, and potable supply contamination.',
      badgeColor: 'bg-[#0071E3]/10 text-[#0071E3] border-[#0071E3]/20',
      iconColor: 'from-[#0071E3] to-[#0051A8]',
    },
    {
      name: 'Sanitation & Solid Waste',
      sla: '48 Hours',
      department: 'Sanitation & Public Health',
      description: 'Overflowing public dumpsters, illegal debris dumping, and sanitary hazards.',
      badgeColor: 'bg-[#34C759]/10 text-[#34C759] border-[#34C759]/20',
      iconColor: 'from-[#34C759] to-[#248A3D]',
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 py-6 max-w-5xl mx-auto px-4 sm:px-6">
      {/* 1. HERO SECTION WITH APPLE DYNAMIC ISLAND WIDGET */}
      <section className="text-center pt-6 sm:pt-10 pb-4 space-y-6">
        {/* Apple Dynamic Island Live Status Pill */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full ios-dynamic-island text-xs font-semibold tracking-tight shadow-md hover:scale-[1.02] transition-transform cursor-default">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34C759] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#34C759]"></span>
          </span>
          <span className="text-[#86868B] font-mono text-[11px] uppercase tracking-wider">CIVIC RESOLVE 2.0</span>
          <span className="text-white/40">•</span>
          <span className="text-white font-medium text-[11px]">Live 24/7 SLA Dispatch</span>
        </div>

        {/* Hero Title (SF Pro Typography) */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#1D1D1F] max-w-3xl mx-auto leading-[1.1]">
            Civic Issue Resolution.
          </h1>
          <p className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#0071E3] via-[#5856D6] to-[#34C759]">
            Engineered for Precision.
          </p>
        </div>

        {/* Hero Subtitle */}
        <p className="text-sm sm:text-base text-[#86868B] max-w-xl mx-auto leading-relaxed">
          Report municipal defects with geo-tagged photographic proof in 30 seconds. Track field crew dispatch with verified GPS coordinates and live SLA transparency.
        </p>

        {/* Action Buttons (Apple Capsule Aesthetics) */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/report-issue"
            className="ios-btn-primary px-6 py-3 text-sm font-semibold rounded-full shadow-md hover:shadow-lg transition active:scale-95"
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
            <span>Support</span>
          </a>
        </div>

        {/* Apple Live Resolution Activity Widget (Interactive iPhone Style Preview) */}
        <div className="pt-4 max-w-lg mx-auto">
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-black/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.06)] text-left space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-[#0071E3] to-[#0051A8] flex items-center justify-center text-white ios-app-icon shadow-sm">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1D1D1F]">Ticket #CIVIC-2026-8841</div>
                  <div className="text-[10px] text-[#86868B] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#0071E3]" />
                    <span>Sector 4 North Corridor • Geotagged</span>
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20">
                In Progress
              </span>
            </div>

            {/* 3-Phase Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-semibold text-[#86868B]">
                <span className="text-[#0071E3]">Phase 2: Crew On-Site</span>
                <span className="font-mono text-[#1D1D1F]">SLA: 18h 42m Left</span>
              </div>
              <div className="w-full bg-black/[0.06] rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-[#0071E3] to-[#34C759] h-2 rounded-full w-2/3 transition-all duration-500"></div>
              </div>
            </div>

            <div className="pt-2 border-t border-black/[0.05] flex items-center justify-between text-[11px] text-[#86868B]">
              <span className="flex items-center gap-1 text-[#34C759] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Dual Photo Audit Verified</span>
              </span>
              <span className="font-mono text-[10px] text-[#86868B]">GPS: 37.7749° N, 122.4194° W</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THREE CORE PILLARS (Realistic iOS App Icon Cards) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-3xl bg-white border border-black/[0.07] shadow-sm hover:shadow-md transition-all duration-200 space-y-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-[#34C759] to-[#248A3D] text-white flex items-center justify-center ios-app-icon shadow-md">
            <Camera className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#1D1D1F]">Geo-Tagged Evidence</h3>
          <p className="text-xs sm:text-sm text-[#86868B] leading-relaxed">
            Attach photo proof with auto-detected GPS coordinates. Built-in spatial intelligence detects duplicate submissions within 50 meters automatically.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-black/[0.07] shadow-sm hover:shadow-md transition-all duration-200 space-y-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-[#0071E3] to-[#0051A8] text-white flex items-center justify-center ios-app-icon shadow-md">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#1D1D1F]">Automated SLA Engine</h3>
          <p className="text-xs sm:text-sm text-[#86868B] leading-relaxed">
            Issues route directly to assigned municipal departments with guaranteed turnaround deadlines and real-time supervisor escalation notifications.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-black/[0.07] shadow-sm hover:shadow-md transition-all duration-200 space-y-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-[#5856D6] to-[#3B39A0] text-white flex items-center justify-center ios-app-icon shadow-md">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#1D1D1F]">Verified Photo Closure</h3>
          <p className="text-xs sm:text-sm text-[#86868B] leading-relaxed">
            Field workers submit completion photos for audit. Citizens rate the repair and verify the fix before the ticket is officially closed.
          </p>
        </div>
      </section>

      {/* 3. OPERATIONAL WORKFLOW: 4 STEP APPLE SEGMENTED VIEWER */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <div className="text-xs font-bold uppercase tracking-wider text-[#0071E3]">
            Lifecycle Workflow
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1F] tracking-tight">
            From citizen report to verified fix.
          </h2>
          <p className="text-xs sm:text-sm text-[#86868B]">
            Every step is recorded with geographic precision, automated SLA tracking, and side-by-side photographic proof.
          </p>
        </div>

        {/* Apple iOS Segmented Control Tabs */}
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
              <p className="text-xs sm:text-sm text-[#86868B] leading-relaxed">
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

      {/* 4. TRANSPARENT SERVICE LEVEL AGREEMENTS (Modular iOS Tiles) */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <div className="text-xs font-bold uppercase tracking-wider text-[#0071E3]">
            Accountability
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1F] tracking-tight">
            Transparent Municipal SLA Targets
          </h2>
          <p className="text-xs sm:text-sm text-[#86868B]">
            Every civic category operates under defined municipal resolution targets with automated supervisor escalation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {slaCategories.map((cat, idx) => (
            <div
              key={idx}
              className="p-5 sm:p-6 rounded-3xl bg-white border border-black/[0.07] shadow-sm hover:border-black/[0.14] transition-all duration-200 flex flex-col justify-between space-y-4"
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
                <p className="text-xs sm:text-sm text-[#86868B] leading-relaxed">
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

      {/* 5. SPOTLIGHT TICKET SEARCH BAR (iOS Spotlight Style) */}
      <section className="p-6 sm:p-10 rounded-3xl bg-gradient-to-b from-[#1D1D1F] to-[#000000] text-white text-center space-y-5 shadow-xl">
        <div className="max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/80 text-[11px] font-semibold">
            <Search className="w-3.5 h-3.5 text-[#0071E3]" />
            <span>Spotlight Ticket Lookup</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white">
            Track a specific civic ticket
          </h2>
          <p className="text-xs sm:text-sm text-white/60">
            Enter your ticket ID to inspect real-time progress, crew dispatch logs, and photo verification.
          </p>
        </div>

        <form onSubmit={handleSearch} className="max-w-md mx-auto flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={ticketQuery}
            onChange={(e) => setTicketQuery(e.target.value)}
            placeholder="e.g. CIVIC-2026-XXXXX"
            className="flex-1 text-xs sm:text-sm font-mono py-3 px-4 rounded-2xl bg-white/10 text-white placeholder-white/40 border border-white/15 outline-none focus:ring-2 focus:ring-[#0071E3] focus:bg-white/15 transition"
            aria-label="Issue Ticket ID"
          />
          <button
            type="submit"
            className="py-3 px-6 rounded-2xl bg-[#0071E3] hover:bg-[#0077ED] text-white font-semibold text-xs sm:text-sm transition shadow-md active:scale-95 shrink-0"
          >
            Lookup
          </button>
        </form>

        <div className="text-xs text-white/50 pt-1">
          <span>Or explore the public map: </span>
          <Link to="/map" className="text-[#32ADE6] hover:underline font-semibold">
            Interactive Civic Map &rarr;
          </Link>
        </div>
      </section>

      {/* 6. BOTTOM CALL TO ACTION */}
      <section className="text-center py-4 space-y-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1F] tracking-tight">
          Help build a cleaner, safer city.
        </h2>
        <p className="text-xs sm:text-sm text-[#86868B] max-w-md mx-auto">
          Submit defects in under 30 seconds. Real-time updates delivered to your device.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to="/report-issue"
            className="ios-btn-primary px-6 py-3 text-sm font-semibold rounded-full shadow-md"
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


