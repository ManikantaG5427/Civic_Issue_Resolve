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
      tagline: 'Precision GPS & photographic proof on site.',
      detail:
        'Citizens photograph civic defects with automatic GPS location tagging. Duplicate reports within 50 meters are automatically indexed.',
      icon: Camera,
      metricLabel: 'Capture Duration',
      metricValue: '< 30 seconds',
      badge: 'Location Geotagged',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    {
      id: 'triage',
      stepNumber: '02',
      title: 'Automated SLA Routing',
      tagline: 'Instant routing to designated municipal departments.',
      detail:
        'Reports enter the triage queue with strict Service Level Agreements. High-priority road or electrical hazards notify supervisors immediately.',
      icon: Clock,
      metricLabel: 'Triage Response',
      metricValue: 'Real-Time Dispatch',
      badge: 'SLA: 24–48 Hours',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    },
    {
      id: 'dispatch',
      stepNumber: '03',
      title: 'Field Crew Dispatch',
      tagline: 'Direct mobile work orders for municipal workers.',
      detail:
        'Assigned field teams receive route navigation, safety briefs, and citizen photos directly on their consoles for 3-phase execution.',
      icon: HardHat,
      metricLabel: 'Execution Protocol',
      metricValue: '3-Phase Progress',
      badge: 'Crew Dispatched',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    {
      id: 'verify',
      stepNumber: '04',
      title: 'Verified Resolution',
      tagline: 'Photographic proof before ticket closure.',
      detail:
        'Field workers submit completion photos for audit. Citizens verify repairs and rate satisfaction before public ticket closure.',
      icon: CheckCircle2,
      metricLabel: 'Resolution Audit',
      metricValue: 'Photo Verified',
      badge: 'Resolved & Closed',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
  ];

  const slaCategories = [
    {
      name: 'Hazardous Electrical & Signals',
      sla: '24 Hours',
      department: 'Electrical Infrastructure',
      description: 'Exposed cables, traffic light outages, and unlit transit corridors.',
      badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
    },
    {
      name: 'Road Hazards & Major Potholes',
      sla: '48 Hours',
      department: 'Road & Transit Engineering',
      description: 'Deep craters, road cave-ins, broken curbs, and transit obstructions.',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    {
      name: 'Water Supply Pipeline Leaks',
      sla: '12 Hours',
      department: 'Municipal Water Board',
      description: 'High-pressure main pipe bursts, roadway flooding, and supply interruptions.',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    },
    {
      name: 'Sanitation & Solid Waste',
      sla: '48 Hours',
      department: 'Sanitation & Health',
      description: 'Overflowing community bins, illegal debris, and public health hazards.',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 py-4 max-w-6xl mx-auto px-4 sm:px-6">
      {/* 1. HERO SECTION */}
      <section className="text-center pt-6 sm:pt-12 pb-2 sm:pb-6 space-y-6">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E2ECE5] text-[#1D3627] text-xs font-bold tracking-wide border border-[#C5DACD] shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
          <span>Official Civic Resolution Network</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 max-w-3xl mx-auto leading-tight font-heading">
          Civic Issue Resolution.
          <span className="block text-[#456A54] font-medium text-2xl sm:text-4xl md:text-5xl mt-1 sm:mt-2">
            Faster. Smarter. Transparent.
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Report municipal infrastructure defects in 30 seconds, track field worker dispatch with verified GPS coordinates, and monitor public repairs in real time.
        </p>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/report-issue"
            className="px-6 py-3 rounded-xl bg-[#1D3627] hover:bg-[#122419] text-white font-bold text-xs sm:text-sm tracking-wider uppercase transition shadow-md hover:shadow-lg active:scale-95"
          >
            Report an Issue
          </Link>

          <Link
            to="/map"
            className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 font-bold text-xs sm:text-sm tracking-wider uppercase transition shadow-sm hover:shadow"
          >
            Explore Civic Map
          </Link>

          <a
            href="mailto:civicissuesolve@gmail.com"
            className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition flex items-center gap-1.5"
          >
            <Mail className="w-4 h-4 text-slate-500" />
            <span>Contact Support</span>
          </a>
        </div>
      </section>

      {/* 2. THREE CORE PILLARS (Clean Responsive Cards) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-[#1D3627]/40 transition space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center shadow-sm">
            <Camera className="w-6 h-6 text-emerald-700" />
          </div>
          <h3 className="text-base font-bold text-slate-900 font-heading">Geo-Tagged Evidence</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Attach photo proof with auto-detected GPS coordinates. Duplicate detection flags nearby submissions automatically.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-[#1D3627]/40 transition space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-800 border border-blue-200 flex items-center justify-center shadow-sm">
            <Zap className="w-6 h-6 text-blue-700" />
          </div>
          <h3 className="text-base font-bold text-slate-900 font-heading">SLA-Driven Dispatch</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Issues route straight to assigned municipal departments with guaranteed turnaround deadlines and automated escalation.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-[#1D3627]/40 transition space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-6 h-6 text-amber-700" />
          </div>
          <h3 className="text-base font-bold text-slate-900 font-heading">Verified Photo Closure</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Field workers upload before/after photos upon completion. Citizens rate the repair before the ticket is marked resolved.
          </p>
        </div>
      </section>

      {/* 3. OPERATIONAL WORKFLOW: 4 STEP INTERACTIVE VIEWER */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Lifecycle Workflow
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 font-heading tracking-tight">
            From citizen report to verified fix.
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Every step is recorded with geographic precision, automated SLA tracking, and side-by-side photographic proof.
          </p>
        </div>

        {/* Step Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 pb-2">
          {workflowSteps.map((step, idx) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(idx)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                activeStep === idx
                  ? 'bg-[#1D3627] text-white border-[#1D3627] shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{step.stepNumber}. {step.title}</span>
            </button>
          ))}
        </div>

        {/* Active Step Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-7 space-y-4">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${workflowSteps[activeStep].badgeColor}`}>
                {workflowSteps[activeStep].badge}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
                {workflowSteps[activeStep].tagline}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {workflowSteps[activeStep].detail}
              </p>

              <div className="pt-3 flex items-center gap-6 border-t border-slate-100">
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">{workflowSteps[activeStep].metricLabel}</div>
                  <div className="text-base font-extrabold text-slate-900 font-mono">{workflowSteps[activeStep].metricValue}</div>
                </div>
              </div>
            </div>

            <div className="md:col-span-5 bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Live Resolution Standard
              </div>
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1.5 shadow-sm">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Geographic Spatial Verification</span>
                </div>
                <div className="text-xs font-mono text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                  GPS Radius Match: Exact location verified
                </div>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                <span>Cryptographically Timestamped</span>
                <span className="text-emerald-700 font-semibold">• Active</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. TRANSPARENT SERVICE LEVEL AGREEMENTS */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Accountability
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
            Transparent Municipal SLA Targets
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Every civic category operates under defined municipal resolution targets. Escalations happen automatically when deadlines approach.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {slaCategories.map((cat, idx) => (
            <div
              key={idx}
              className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-[#1D3627]/30 transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {cat.department}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${cat.badgeColor}`}>
                    Target: {cat.sla}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 font-heading">{cat.name}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {cat.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Escalation: Supervisor notice</span>
                <Link to="/report-issue" className="text-emerald-800 font-bold hover:underline flex items-center gap-1">
                  Report &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. TICKET TRACKER SEARCH BAR */}
      <section className="p-6 sm:p-10 rounded-3xl bg-[#1D3627] text-white text-center space-y-5 shadow-lg">
        <div className="max-w-xl mx-auto space-y-2">
          <h2 className="text-xl sm:text-3xl font-extrabold font-heading tracking-tight text-white">
            Track a specific civic ticket
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/80">
            Enter your issue ticket ID to inspect real-time progress, worker logs, and photo verification.
          </p>
        </div>

        <form onSubmit={handleSearch} className="max-w-md mx-auto flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={ticketQuery}
            onChange={(e) => setTicketQuery(e.target.value)}
            placeholder="e.g. CIVIC-2026-XXXXX"
            className="flex-1 text-xs sm:text-sm font-mono py-2.5 px-4 rounded-xl bg-white text-slate-900 border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-400"
            aria-label="Issue Ticket ID"
          />
          <button
            type="submit"
            className="py-2.5 px-5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs sm:text-sm uppercase tracking-wider transition shadow-sm shrink-0"
          >
            Lookup
          </button>
        </form>

        <div className="text-xs text-emerald-200/70 pt-1">
          <span>Or explore the public map: </span>
          <Link to="/map" className="text-emerald-300 hover:underline font-bold">
            Interactive Civic Map &rarr;
          </Link>
        </div>
      </section>

      {/* 6. BOTTOM CALL TO ACTION */}
      <section className="text-center py-4 space-y-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
          Help build a cleaner, safer city.
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
          Submit defects in under 30 seconds. Real-time updates delivered to your device.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to="/report-issue"
            className="px-6 py-3 rounded-xl bg-[#1D3627] hover:bg-[#122419] text-white font-bold text-xs sm:text-sm tracking-wider uppercase transition shadow-md"
          >
            Submit an Issue Now
          </Link>
          <Link
            to="/catalog"
            className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 font-bold text-xs sm:text-sm tracking-wider uppercase transition shadow-sm"
          >
            View Category Catalog
          </Link>
        </div>
      </section>
    </div>
  );
}

