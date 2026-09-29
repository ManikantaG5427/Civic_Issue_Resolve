import React, { useState, useEffect } from 'react';
import { checkBackendHealth } from '../services/api';
import { Activity, Database, Server, RefreshCw, CheckCircle2, AlertTriangle, Clock, Cpu } from 'lucide-react';

export default function HealthChecker() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await checkBackendHealth();
      setHealthData(response.data);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="glass-panel rounded-2xl p-6 glow-teal border border-slate-700/60 shadow-xl bg-slate-900/60">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">System Health & Connectivity</h3>
            <p className="text-xs text-slate-400">
              Live status ping to <code className="text-teal-300">GET /api/health</code>
            </p>
          </div>
        </div>

        <button
          onClick={fetchHealth}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium border border-slate-700 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-400' : ''}`} />
          <span>{loading ? 'Checking...' : 'Refresh Status'}</span>
        </button>
      </div>

      <div className="mt-5">
        {loading && !healthData && (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <RefreshCw className="w-8 h-8 text-teal-400 animate-spin mb-3" />
            <p className="text-sm text-slate-400">Testing connection to backend API...</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Backend Unreachable</p>
              <p className="text-xs text-rose-400/80 mt-1">{error}</p>
              <p className="text-xs text-slate-400 mt-2">
                Make sure the backend server is running on <code className="text-slate-200">http://localhost:5000</code>.
              </p>
            </div>
          </div>
        )}

        {healthData && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Server Status */}
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-800 flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">Server API</div>
                  <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Operational
                  </div>
                </div>
              </div>

              {/* Database Status */}
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-800 flex items-center space-x-3">
                <div
                  className={`p-2 rounded-lg border ${
                    healthData.database?.connected
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}
                >
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">MongoDB</div>
                  <div
                    className={`text-sm font-semibold capitalize ${
                      healthData.database?.connected ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {healthData.database?.status || 'Unknown'}
                  </div>
                </div>
              </div>

              {/* Server Uptime */}
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-800 flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">Uptime</div>
                  <div className="text-sm font-semibold text-slate-200">{healthData.uptime}</div>
                </div>
              </div>

              {/* Memory Usage */}
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-800 flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">Memory (Heap)</div>
                  <div className="text-sm font-semibold text-slate-200">
                    {healthData.memoryUsage?.heapUsed}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 px-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                Environment: <span className="text-slate-200 uppercase font-mono">{healthData.environment}</span>
              </span>
              <span>Last checked at: {lastChecked}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
