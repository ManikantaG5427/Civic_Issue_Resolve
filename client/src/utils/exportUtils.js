/**
 * Utility functions for exporting data to CSV and JSON formats
 */

/**
 * Convert an array of objects to a CSV string and trigger browser download
 * @param {Array<Object>} data Array of records to export
 * @param {string} filename Base filename (e.g. 'civic_issues_export')
 * @param {Array<{key: string, label: string}>} columns Column definitions
 */
export function exportToCSV(data, filename = 'export', columns = null) {
  if (!Array.isArray(data) || data.length === 0) {
    alert('No data available to export.');
    return;
  }

  let headers = [];
  let keys = [];

  if (columns && Array.isArray(columns) && columns.length > 0) {
    headers = columns.map((c) => c.label);
    keys = columns.map((c) => c.key);
  } else {
    keys = Object.keys(data[0]);
    headers = keys.map((k) => k.toUpperCase());
  }

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    let str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    str = str.replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvRows = [];
  csvRows.push(headers.map((h) => `"${h}"`).join(','));

  for (const item of data) {
    const row = keys.map((k) => {
      // Support nested keys like 'serviceArea.name'
      const val = k.split('.').reduce((obj, key) => (obj && obj[key] !== undefined ? obj[key] : ''), item);
      return escapeCSV(val);
    });
    csvRows.push(row.join(','));
  }

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvRows.join('\r\n'));
  const link = document.createElement('a');
  link.setAttribute('href', csvContent);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export Comprehensive Civic Analysis & Intelligence Report to CSV
 * @param {Object} analytics Analytics payload from /api/admin/analytics or generated metrics
 * @param {Object} options Time range and service area label
 */
export function exportCivicAnalysisCSV(analytics, options = {}) {
  if (!analytics || !analytics.kpis) {
    alert('No civic analytics data available to export.');
    return;
  }

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    let str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    str = str.replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = [];
  const addRow = (...cols) => rows.push(cols.map(escapeCSV).join(','));
  const addEmpty = () => rows.push('');

  // 1. Report Header
  addRow('CIVICRESOLVE MUNICIPAL INTELLIGENCE & RESOLUTION ANALYSIS REPORT');
  addRow('Report Generation Timestamp', new Date().toISOString());
  addRow('Scope Service Area / Zone', options.serviceArea || 'All Municipal Zones');
  addRow('Evaluated Time Range Window', options.timeRange || 'Last 30 Days (30d)');
  addEmpty();

  // 2. Executive KPI Overview
  addRow('=== EXECUTIVE CIVIC PERFORMANCE METRICS ===');
  addRow('Metric Name', 'Evaluated Value', 'Standard Benchmark / Target');
  addRow('Total Civic Reports Filed', analytics.kpis.totalReported || 0, '100% Inflow Tracked');
  addRow('Total Resolved Complaints', analytics.kpis.totalResolved || 0, 'SLA Resolution Goal');
  addRow('Actionable Pending Triage Queue', analytics.kpis.pendingTriage || 0, '< 12h Verification SLA');
  addRow('Active In-Progress Field Works', analytics.kpis.inProgress || 0, 'Active Crew Operations');
  addRow('Overall Resolution Velocity (%)', `${analytics.kpis.resolutionRate || 0}%`, 'Target: > 85%');
  addRow('Average Resolution Duration (Hours)', `${analytics.kpis.avgResolutionTimeHours || 0} hrs`, 'Target: < 48 hrs');
  addRow('SLA Compliance Rate (%)', `${analytics.kpis.slaComplianceRate || 0}%`, 'Target: > 90%');
  addRow('Critical SLA Breaches / Escalated', analytics.kpis.escalatedCount || 0, 'Zero Escalation Target');
  addRow('Citizen Satisfaction Index', `${analytics.kpis.citizenSatisfactionScore || 5.0} / 5.0 ⭐`, 'Target: > 4.5 Stars');
  addEmpty();

  // 3. Department Performance Breakdown
  addRow('=== MUNICIPAL DEPARTMENT PERFORMANCE & RESOLUTION RATES ===');
  addRow('Department Name', 'Dept Code', 'Total Assigned Tasks', 'Completed Repairs', 'SLA Escalations', 'Resolution Rate (%)');
  if (Array.isArray(analytics.departmentPerformance) && analytics.departmentPerformance.length > 0) {
    analytics.departmentPerformance.forEach((dept) => {
      addRow(
        dept.name,
        dept.code || 'N/A',
        dept.totalAssigned || 0,
        dept.totalResolved || 0,
        dept.escalatedCount || 0,
        `${dept.completionRate || 0}%`
      );
    });
  } else {
    addRow('No department workload logged in this period', '', '', '', '', '');
  }
  addEmpty();

  // 4. Civic Complaint Categories Distribution
  addRow('=== CIVIC DEFECT CATEGORY BREAKDOWN ===');
  addRow('Complaint Category', 'Category Code', 'Incident Count', 'Percentage of Total Municipal Load (%)');
  if (Array.isArray(analytics.categoriesBreakdown) && analytics.categoriesBreakdown.length > 0) {
    analytics.categoriesBreakdown.forEach((cat) => {
      addRow(
        cat.name,
        cat.code || 'N/A',
        cat.count || 0,
        `${cat.percentage || 0}%`
      );
    });
  } else {
    addRow('No category distribution available', '', '', '');
  }
  addEmpty();

  // 5. Field Worker Leaderboard
  addRow('=== FIELD WORKER OPERATIONAL LEADERBOARD ===');
  addRow('Worker Full Name', 'Official Contact', 'Assigned Work Orders', 'Verified Completed', 'Completion Rate (%)', 'Citizen Rating');
  if (Array.isArray(analytics.workerLeaderboard) && analytics.workerLeaderboard.length > 0) {
    analytics.workerLeaderboard.forEach((w) => {
      addRow(
        w.name,
        w.email,
        w.totalAssigned || 0,
        w.totalCompleted || 0,
        `${w.completionRate || 0}%`,
        `${w.rating || '5.0'} / 5.0 ⭐`
      );
    });
  } else {
    addRow('No active field crew records in current filter window', '', '', '', '', '');
  }

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(rows.join('\r\n'));
  const link = document.createElement('a');
  link.setAttribute('href', csvContent);
  const sanitizedFilename = `CivicResolve_Analysis_Report_${new Date().toISOString().slice(0, 10)}.csv`;
  link.setAttribute('download', sanitizedFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export data as formatted JSON file
 */
export function exportToJSON(data, filename = 'export') {
  if (!data) {
    alert('No data available to export.');
    return;
  }

  const jsonContent = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', jsonContent);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
