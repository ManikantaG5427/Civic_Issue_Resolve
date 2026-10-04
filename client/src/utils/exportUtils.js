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
