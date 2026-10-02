import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [ticketQuery, setTicketQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!ticketQuery.trim()) return;
    navigate(`/issues/${ticketQuery.trim()}`);
  };

  const workflowSteps = [
    {
      id: 'capture',
      title: '1. Citizen Capture',
      tagline: 'Precision GPS and photo evidence on site.',
      detail:
        'Citizens photograph infrastructure defects using high-accuracy geolocation. EXIF timestamps and spatial indexing automatically flag duplicate reports within 50 meters.',
      metricLabel: 'Capture Time',
      metricValue: '< 30 seconds',
      badge: 'Location Verified',
      uiHighlight: 'GPS: 17.3850° N, 78.4867° E (± 3.2m accuracy)',
      sampleTitle: 'Deep Asphalt Pothole on 4th Cross Ave',
      category: 'Roads & Asphalt',
    },
    {
      id: 'triage',
      title: '2. SLA Triage',
      tagline: 'Automated municipal department routing.',
      detail:
        'Reports enter the administrative triage engine with category-specific Service Level Agreements. High-priority safety hazards trigger automated notifications to on-duty supervisors.',
      metricLabel: 'Triage Response',
      metricValue: 'Instant routing',
      badge: 'SLA: 48 Hours',
      uiHighlight: 'Department: Public Works • Priority: High',
      sampleTitle: 'Work Order #WO-8492 Generated',
      category: 'Department Assigned',
    },
    {
      id: 'dispatch',
      title: '3. Field Dispatch',
      tagline: 'Direct mobile work orders for municipal crews.',
      detail:
        'Authorized field workers receive task briefs with navigation coordinates, safety equipment requirements, and citizen photo records directly on their mobile consoles.',
      metricLabel: 'Dispatch Protocol',
      metricValue: 'Cryptographic Auth',
      badge: 'Field Unit Assigned',
      uiHighlight: 'Unit: North Road Maintenance Crew #4',
      sampleTitle: 'In Progress • Material En Route',
      category: 'Field Execution',
    },
    {
      id: 'verify',
      title: '4. Verified Closure',
      tagline: 'Photographic proof before public closure.',
      detail:
        'Field workers submit geotagged completion photos. Municipal administrators verify the repair before the ticket status transitions to Resolved on the Public Civic Map.',
      metricLabel: 'Verification Standard',
      metricValue: 'Photo Audit',
      badge: 'Resolved & Closed',
      uiHighlight: 'Resolution Time: 18h 42m (Within 48h SLA)',
      sampleTitle: 'Permanent Cold Mix Patch Completed',
      category: 'Public Proof',
    },
  ];

  const slaCategories = [
    {
      name: 'Hazardous Electrical & Streetlights',
      sla: '24 Hours',
      department: 'Electrical Infrastructure',
      description: 'Exposed wiring, traffic signal outages, and dark transit corridors.',
    },
    {
      name: 'Road Hazards & Major Potholes',
      sla: '48 Hours',
      department: 'Road & Transit Engineering',
      description: 'Craters, road cave-ins, broken curbs, and transit lane obstructions.',
    },
    {
      name: 'Water Main Bursts & Contamination',
      sla: '12 Hours',
      department: 'Municipal Water & Sewerage',
      description: 'High-pressure pipeline leaks, flooded roadways, and supply line cuts.',
    },
    {
      name: 'Sanitation & Illegal Dumping',
      sla: '72 Hours',
      department: 'Solid Waste Management',
      description: 'Overflowing community bins, construction debris, and hazardous waste.',
    },
  ];

  return (
    <div className="space-y-24 py-4 max-w-6xl mx-auto px-4 sm:px-6">
      {/* 1. HERO SECTION */}
      <section className="text-center pt-8 pb-4 space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8E8ED] text-[#1D1D1F] text-xs font-medium tracking-wide">
          <span>Civic Infrastructure Platform</span>
          <span className="text-[#86868B]">&bull;</span>
          <span className="text-[#0071E3]">Version 2.0</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-[#1D1D1F] max-w-4xl mx-auto leading-[1.06]">
          Civic resolution.
          <span className="block text-[#86868B] font-normal">Engineered for clarity.</span>
        </h1>

        <p className="text-base sm:text-lg text-[#6E6E73] max-w-2xl mx-auto font-normal leading-relaxed">
          Report municipal infrastructure defects, track field worker dispatch with verified GPS coordinates, and monitor public repairs in real time.
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link to="/report-issue" className="apple-btn-primary">
            Report an Issue
          </Link>
          <Link to="/map" className="apple-btn-secondary">
            Explore Civic Map
          </Link>
          {!isAuthenticated && (
            <Link to="/login" className="apple-link text-sm ml-2">
              Sign in to track reports &rarr;
            </Link>
          )}
        </div>

        {/* HERO PRODUCT PREVIEW CANVAS */}
        <div className="pt-8 max-w-5xl mx-auto">
          <div className="apple-panel overflow-hidden border border-[#D2D2D7] bg-[#FFFFFF] shadow-sm">
            {/* Top Device Bar */}
            <div className="px-4 py-3 bg-[#F5F5F7] border-b border-[#E5E5E7] flex items-center justify-between text-xs text-[#6E6E73]">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-[#D2D2D7] inline-block" />
                <span className="w-3 h-3 rounded-full bg-[#D2D2D7] inline-block" />
                <span className="w-3 h-3 rounded-full bg-[#D2D2D7] inline-block" />
              </div>
              <div className="font-mono text-[11px] text-[#86868B] bg-[#FFFFFF] px-3 py-1 rounded-md border border-[#E5E5E7]">
                civicresolve.internal / console / live-feed
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span className="text-[11px] text-[#1D1D1F] font-medium">Live System Active</span>
              </div>
            </div>

            {/* Mockup Body: Split View (Citizen App + Municipal Triage) */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 bg-[#FAFAFC] text-left">
              {/* Left Column: Citizen Mobile Interface */}
              <div className="md:col-span-5 bg-[#FFFFFF] rounded-xl border border-[#E5E5E7] p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-[#F5F5F7] pb-3">
                  <div className="text-xs font-semibold text-[#1D1D1F]">Citizen Report Card</div>
                  <span className="apple-badge bg-emerald-50 text-emerald-700 border border-emerald-200">
                    GPS Geotagged
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-semibold text-[#1D1D1F]">
                    Severe Water Supply Line Break
                  </div>
                  <div className="text-xs text-[#86868B]">
                    Report ID: ISS-8492 &bull; 14 minutes ago
                  </div>
                  <div className="text-xs text-[#333336] leading-relaxed bg-[#F5F5F7] p-3 rounded-lg border border-[#E5E5E7]">
                    High-pressure water leakage flooding east sidewalk near School Zone 4. Road base is eroding rapidly.
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-[#FAFAFC] rounded-lg border border-[#E5E5E7]">
                    <span className="text-[10px] text-[#86868B] block uppercase font-medium">SLA Limit</span>
                    <span className="text-[#1D1D1F] font-semibold">12 Hours (Urgent)</span>
                  </div>
                  <div className="p-2.5 bg-[#FAFAFC] rounded-lg border border-[#E5E5E7]">
                    <span className="text-[10px] text-[#86868B] block uppercase font-medium">Department</span>
                    <span className="text-[#1D1D1F] font-semibold">Water Authority</span>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between text-xs text-[#6E6E73]">
                  <span>Status: <strong className="text-[#0071E3]">Field Crew Dispatched</strong></span>
                  <Link to="/map" className="text-[#0071E3] font-medium hover:underline">
                    View on Map &rarr;
                  </Link>
                </div>
              </div>

              {/* Right Column: Municipal Admin Triage & Audit */}
              <div className="md:col-span-7 bg-[#FFFFFF] rounded-xl border border-[#E5E5E7] p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-[#F5F5F7] pb-3">
                  <div className="text-xs font-semibold text-[#1D1D1F]">
                    Municipal Triage & Dispatch Console
                  </div>
                  <span className="text-[11px] text-[#86868B]">Auto-Indexed Database</span>
                </div>

                <div className="space-y-3">
                  {/* Item 1 */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[#F5F5F7] border border-[#E5E5E7] text-xs">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-[#1D1D1F]">ISS-8492 &bull; Water Line Break</div>
                      <div className="text-[#86868B]">Assigned to: Crew 07 (Rapid Response)</div>
                    </div>
                    <span className="apple-badge bg-blue-50 text-[#0071E3] border border-blue-200">
                      Dispatched
                    </span>
                  </div>

                  {/* Item 2 */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[#FAFAFC] border border-[#E5E5E7] text-xs">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-[#1D1D1F]">ISS-8488 &bull; Pothole Repair 3rd Ave</div>
                      <div className="text-[#86868B]">Completion verified with photo evidence</div>
                    </div>
                    <span className="apple-badge bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Resolved
                    </span>
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[#FAFAFC] border border-[#E5E5E7] text-xs">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-[#1D1D1F]">ISS-8479 &bull; Streetlight Outage Sector 9</div>
                      <div className="text-[#86868B]">Triage queued &bull; SLA Remaining: 21h 10m</div>
                    </div>
                    <span className="apple-badge bg-amber-50 text-amber-800 border border-amber-200">
                      In Queue
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-[#86868B] border-t border-[#F5F5F7]">
                  <span>Spatial radius deduplication: <strong>50m active</strong></span>
                  <span className="font-mono text-[11px]">Audit Log: Tamper-Proof</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CORE WORKFLOW: INTERACTIVE ARCHITECTURE SIMULATOR */}
      <section className="space-y-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#0071E3]">
            Operational Workflow
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1D1D1F]">
            From citizen report to verified fix.
          </h2>
          <p className="text-sm sm:text-base text-[#6E6E73] leading-relaxed">
            Every step is recorded with geographic precision, automated SLA tracking, and side-by-side photographic validation.
          </p>
          <div className="inline-block text-[11px] text-[#86868B] bg-[#E8E8ED] px-3 py-1 rounded-full">
            Interactive Workflow Demonstration
          </div>
        </div>

        {/* Step Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 border-b border-[#E5E5E7] pb-4">
          {workflowSteps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setActiveTab(index)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
                activeTab === index
                  ? 'bg-[#1D1D1F] text-[#FFFFFF]'
                  : 'bg-[#E8E8ED] text-[#1D1D1F] hover:bg-[#DEDEE3]'
              }`}
            >
              {step.title}
            </button>
          ))}
        </div>

        {/* Active Step Showcase */}
        <div className="apple-panel p-6 sm:p-10 bg-[#FFFFFF]">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-6 space-y-5">
              <span className="apple-badge bg-blue-50 text-[#0071E3] border border-blue-200">
                {workflowSteps[activeTab].badge}
              </span>
              <h3 className="text-2xl font-semibold text-[#1D1D1F] tracking-tight">
                {workflowSteps[activeTab].tagline}
              </h3>
              <p className="text-sm text-[#555558] leading-relaxed">
                {workflowSteps[activeTab].detail}
              </p>

              <div className="pt-2 grid grid-cols-2 gap-4 border-t border-[#F5F5F7]">
                <div>
                  <div className="text-xs text-[#86868B]">{workflowSteps[activeTab].metricLabel}</div>
                  <div className="text-lg font-semibold text-[#1D1D1F]">{workflowSteps[activeTab].metricValue}</div>
                </div>
                <div>
                  <div className="text-xs text-[#86868B]">Status Tag</div>
                  <div className="text-sm font-semibold text-[#0071E3]">{workflowSteps[activeTab].category}</div>
                </div>
              </div>
            </div>

            <div className="md:col-span-6 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7] p-6 space-y-4">
              <div className="text-xs font-mono text-[#86868B] uppercase tracking-wider">
                System Payload Simulation
              </div>
              <div className="p-4 bg-[#FFFFFF] rounded-lg border border-[#E5E5E7] space-y-2">
                <div className="text-xs font-semibold text-[#1D1D1F]">
                  {workflowSteps[activeTab].sampleTitle}
                </div>
                <div className="text-xs font-mono text-[#6E6E73] bg-[#FAFAFC] p-2.5 rounded border border-[#E5E5E7]">
                  {workflowSteps[activeTab].uiHighlight}
                </div>
              </div>
              <div className="text-xs text-[#86868B] flex items-center justify-between">
                <span>Verification State: Cryptographically Signed</span>
                <span className="text-emerald-700 font-medium">&bull; Live Ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MUNICIPAL SLA STANDARDS */}
      <section className="space-y-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#0071E3]">
            Accountability
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1D1D1F]">
            Transparent Service Level Agreements.
          </h2>
          <p className="text-sm sm:text-base text-[#6E6E73] leading-relaxed">
            Every civic category operates under defined municipal resolution targets. Escalations happen automatically when deadlines approach.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {slaCategories.map((cat, idx) => (
            <div
              key={idx}
              className="apple-panel p-6 bg-[#FFFFFF] space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#86868B] uppercase tracking-wider">
                    {cat.department}
                  </span>
                  <span className="apple-badge bg-[#E8E8ED] text-[#1D1D1F] font-semibold">
                    Target: {cat.sla}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-[#1D1D1F]">{cat.name}</h3>
                <p className="text-xs sm:text-sm text-[#555558] leading-relaxed">
                  {cat.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#F5F5F7] flex items-center justify-between text-xs">
                <span className="text-[#86868B]">Escalation: Auto-supervisor notice</span>
                <Link to="/report-issue" className="text-[#0071E3] font-medium hover:underline">
                  Report Defect &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. LIVE TICKET SEARCH BAR */}
      <section className="apple-panel p-8 sm:p-12 bg-[#FFFFFF] text-center space-y-6">
        <div className="max-w-xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#1D1D1F] tracking-tight">
            Track a specific civic ticket.
          </h2>
          <p className="text-xs sm:text-sm text-[#6E6E73]">
            Enter your issue ticket ID to inspect real-time progress, field logs, and photo verification.
          </p>
        </div>

        <form onSubmit={handleSearch} className="max-w-md mx-auto flex gap-2">
          <input
            type="text"
            value={ticketQuery}
            onChange={(e) => setTicketQuery(e.target.value)}
            placeholder="e.g., ISS-8492 or MongoDB ID"
            className="apple-input flex-1 text-sm font-mono"
            aria-label="Issue Ticket ID"
          />
          <button type="submit" className="apple-btn-dark text-sm whitespace-nowrap">
            Lookup
          </button>
        </form>

        <div className="text-xs text-[#86868B] flex flex-wrap items-center justify-center gap-2">
          <span>Or explore public map:</span>
          <Link to="/map" className="text-[#0071E3] hover:underline font-medium">
            Open Interactive Civic Map &rarr;
          </Link>
        </div>
      </section>

      {/* 5. CALL TO ACTION */}
      <section className="text-center py-8 space-y-6">
        <h2 className="text-3xl sm:text-4xl font-semibold text-[#1D1D1F] tracking-tight">
          Help build a safer, better-maintained city.
        </h2>
        <p className="text-sm sm:text-base text-[#6E6E73] max-w-lg mx-auto">
          Submit defects in under 30 seconds. No paperwork required.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link to="/report-issue" className="apple-btn-primary">
            Submit an Issue Now
          </Link>
          <Link to="/catalog" className="apple-btn-secondary">
            View Category Catalog
          </Link>
        </div>
      </section>
    </div>
  );
}
