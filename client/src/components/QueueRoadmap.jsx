import React from 'react';
import { ShieldCheck, Database, Lock, Layers, FilePlus2, MapPin, Camera, ClipboardList } from 'lucide-react';

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
      status: 'active',
      desc: 'Multer secure multi-photo evidence uploads, previews & gallery.',
      icon: Camera,
    },
    {
      id: 7,
      name: 'My Reports & Timeline',
      status: 'pending',
      desc: 'Citizen reports dashboard, search/filter, pagination & status timeline.',
      icon: ClipboardList,
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
