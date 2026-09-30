import React from 'react';
import {
  ShieldCheck,
  Database,
  Lock,
  Layers,
  FilePlus2,
  MapPin,
  Camera,
  ClipboardList,
  Star,
  Bell,
  Radio,
  MessageSquare,
  Compass,
  Zap,
  BarChart3,
  ShieldAlert,
  Smartphone,
  Wrench,
} from 'lucide-react';

export default function QueueRoadmap() {
  const queues = [
    {
      id: 0,
      name: 'Project Foundation',
      status: 'done',
      desc: 'MERN structure, Vite client, Express server, health route, error handling.',
      icon: Database,
    },
    {
      id: 1,
      name: 'Authentication',
      status: 'done',
      desc: 'User model, register, login, bcryptjs hash, JWT tokens, protected routes.',
      icon: Lock,
    },
    {
      id: 2,
      name: 'Roles & RBAC',
      status: 'done',
      desc: 'Citizen, Field Worker, Admin, Super Admin backend permissions & routes.',
      icon: ShieldCheck,
    },
    {
      id: 3,
      name: 'Configuration Data',
      status: 'done',
      desc: 'Categories, departments, pilot service areas, seed scripts, & admin APIs.',
      icon: Layers,
    },
    {
      id: 4,
      name: 'Citizen Creates Issue',
      status: 'done',
      desc: 'CIVIC-YYYY-XXXXXX ticket generator, submitted status, validation & timeline.',
      icon: FilePlus2,
    },
    {
      id: 5,
      name: 'Map Location & GPS',
      status: 'done',
      desc: 'Interactive Leaflet OSM pin drop, draggable marker, & browser GPS capture.',
      icon: MapPin,
    },
    {
      id: 6,
      name: 'Evidence Image Upload',
      status: 'done',
      desc: 'Multer secure multi-photo evidence uploads, previews & gallery.',
      icon: Camera,
    },
    {
      id: 7,
      name: 'My Reports & Timeline',
      status: 'done',
      desc: 'Citizen reports dashboard, search/filter, pagination & status timeline.',
      icon: ClipboardList,
    },
    {
      id: 8,
      name: 'Admin Review Queue',
      status: 'done',
      desc: 'Triage dashboard, metrics counters, service area scoping, and filtering.',
      icon: Layers,
    },
    {
      id: 9,
      name: 'Verify, Reject, Clarify',
      status: 'done',
      desc: 'Admin triage verification, mandatory rejection audit reasons, citizen clarification.',
      icon: ShieldCheck,
    },
    {
      id: 10,
      name: 'Assignment Workflow',
      status: 'done',
      desc: 'Municipal department and field worker assignment with SLA deadlines.',
      icon: Database,
    },
    {
      id: 11,
      name: 'Worker Dashboard',
      status: 'done',
      desc: 'Field worker assigned tasks queue, SLA countdowns, and GPS navigation.',
      icon: ClipboardList,
    },
    {
      id: 12,
      name: 'Worker Progress Updates',
      status: 'done',
      desc: 'Start work status transition, progress logs, materials tracking, and stage photos.',
      icon: Camera,
    },
    {
      id: 13,
      name: 'Resolution Proof & Photos',
      status: 'done',
      desc: 'Mandatory before/after repair proof photos, materials logging, and cost tracking.',
      icon: ShieldCheck,
    },
    {
      id: 14,
      name: 'Citizen Verification & Closure',
      status: 'done',
      desc: '1-5 star citizen rating & feedback or mandatory defect explanation with photos.',
      icon: Star,
    },
    {
      id: 15,
      name: 'In-App Notifications',
      status: 'done',
      desc: 'Persistent notifications model, badge counter, and live status updates.',
      icon: Bell,
    },
    {
      id: 16,
      name: 'Real-Time Socket.IO',
      status: 'done',
      desc: 'Live bi-directional room subscriptions, ticket updates, and instant alerts.',
      icon: Radio,
    },
    {
      id: 17,
      name: 'Comments & Internal Notes',
      status: 'done',
      desc: 'Public citizen discussions and private municipal internal notes with RBAC.',
      icon: MessageSquare,
    },
    {
      id: 18,
      name: 'Geospatial Duplicate Detection',
      status: 'done',
      desc: 'MongoDB 2dsphere proximity radius search, upvoting, and follow subscriptions.',
      icon: Compass,
    },
    {
      id: 19,
      name: 'Automated SLA Engine',
      status: 'done',
      desc: 'Background cron monitor for overdue SLA deadlines, auto-escalation, and alerts.',
      icon: Zap,
    },
    {
      id: 20,
      name: 'Municipal Analytics',
      status: 'done',
      desc: 'Executive KPI scorecard, resolution velocity, category distributions, & worker leaderboard.',
      icon: BarChart3,
    },
    {
      id: 21,
      name: 'Public Civic Map',
      status: 'done',
      desc: 'Open interactive Leaflet map explorer, status presets, and drawer previews.',
      icon: MapPin,
    },
    {
      id: 22,
      name: 'Security & Production Hardening',
      status: 'done',
      desc: 'Helmet, rate limiters, interactive OpenAPI 3.0 documentation, & full test coverage.',
      icon: ShieldAlert,
    },
    {
      id: 23,
      name: 'Mobile App Foundation',
      status: 'done',
      desc: 'React Native Expo companion app architecture, AuthContext, JWT persistence & role routing.',
      icon: Smartphone,
    },
    {
      id: 24,
      name: 'Mobile Citizen Reporting',
      status: 'done',
      desc: 'Photo capture, GPS coordinate fetching, categories, and live duplicate warning.',
      icon: Camera,
    },
    {
      id: 25,
      name: 'Mobile Tracking & Ratings',
      status: 'done',
      desc: 'Live Socket timeline sync, public comments, citizen 1-5 star verification and reopen.',
      icon: Star,
    },
    {
      id: 26,
      name: 'Mobile Worker Task Queue',
      status: 'done',
      desc: 'SLA countdowns, start work action, interim progress logs & photo proof completion.',
      icon: Wrench,
    },
    {
      id: 27,
      name: 'Mobile Map & Alerts',
      status: 'done',
      desc: 'City-wide verified civic map explorer, status presets, category chips & alert center.',
      icon: Radio,
    },
  ];

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 bg-slate-900/40">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-semibold text-white">Development Queue Overview</h3>
          <p className="text-xs text-slate-400">Strict vertical slice implementation roadmap</p>
        </div>
        <span className="text-xs font-mono text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/20">
          Vertical Slice Mode
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {queues.map((q) => {
          const Icon = q.icon;
          const isActive = q.status === 'active';
          const isDone = q.status === 'done';

          return (
            <div
              key={q.id}
              className={`p-4 rounded-xl border transition-all duration-200 ${
                isActive
                  ? 'bg-teal-950/20 border-teal-500/40 ring-1 ring-teal-500/30 shadow-lg shadow-teal-950/50'
                  : isDone
                  ? 'bg-emerald-950/10 border-emerald-500/30'
                  : 'bg-slate-800/30 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`p-2 rounded-lg ${
                    isActive
                      ? 'bg-teal-500/20 text-teal-400'
                      : isDone
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      : isDone
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {isDone ? 'Completed' : isActive ? 'Current Queue' : 'Upcoming'}
                </span>
              </div>

              <div className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-mono">Q{q.id}</span>
                <span>{q.name}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{q.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
