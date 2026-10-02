/**
 * OpenAPI 3.0 Specification for CivicResolve Municipal Platform
 */
export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'CivicResolve - Civic Issue Resolution Platform API',
    version: '2.0.0',
    description:
      'Production-grade full-stack municipal platform API for Citizens, Field Workers, Administrators, and Super Admins.',
    contact: {
      name: 'CivicResolve Technical Architecture Team',
      email: 'tech@civicresolve.org',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Local Development Server',
    },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'System health check and diagnostic metrics',
        tags: ['System'],
        responses: {
          200: { description: 'System operational with memory and database status' },
        },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register a new user (Citizen, Field Worker, Admin)',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  password: { type: 'string' },
                  role: { type: 'string', enum: ['citizen', 'field_worker', 'administrator'] },
                  phone: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'User registered with JWT tokens' },
          400: { description: 'Validation error' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate and receive access and refresh tokens',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Authentication successful' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/issues': {
      post: {
        summary: 'Submit a new civic issue report with photographic evidence',
        tags: ['Citizen Issues'],
        security: [{ BearerAuth: [] }],
        responses: {
          201: { description: 'Civic issue report created' },
        },
      },
    },
    '/issues/nearby-duplicates': {
      get: {
        summary: 'Geospatial proximity query for duplicate detection',
        tags: ['Geospatial'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'latitude', in: 'query', required: true, schema: { type: 'number' } },
          { name: 'longitude', in: 'query', required: true, schema: { type: 'number' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Nearby issues within radius' },
        },
      },
    },
    '/issues/public-map': {
      get: {
        summary: 'Public verified civic map markers (anonymized reporter)',
        tags: ['Public Map'],
        responses: {
          200: { description: 'Public map points' },
        },
      },
    },
    '/issues/{id}/comments': {
      post: {
        summary: 'Post discussion comment or confidential internal note',
        tags: ['Discussions'],
        security: [{ BearerAuth: [] }],
        responses: {
          201: { description: 'Comment recorded' },
        },
      },
      get: {
        summary: 'Retrieve sanitized comments for issue',
        tags: ['Discussions'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Comments list' },
        },
      },
    },
    '/admin/review-queue': {
      get: {
        summary: 'Triage review queue with filtering and sorting',
        tags: ['Administrator Operations'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Review queue list' },
        },
      },
    },
    '/admin/sla/check-escalations': {
      post: {
        summary: 'Trigger automated SLA escalation sweep across overdue issues',
        tags: ['SLA Engine'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'SLA sweep results' },
        },
      },
    },
    '/admin/analytics': {
      get: {
        summary: 'Executive municipal intelligence and resolution analytics',
        tags: ['Analytics'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Aggregated KPIs and throughput metrics' },
        },
      },
    },
    '/worker/tasks': {
      get: {
        summary: 'Field worker task assignment queue',
        tags: ['Field Operations'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Assigned tasks' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};

/**
 * Render interactive HTML Documentation viewer
 */
export const getDocsHtml = (req, res) => {
  if (req.headers.accept?.includes('application/json') || req.query.format === 'json') {
    return res.status(200).json(openApiSpec);
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CivicResolve API Documentation · Production Platform</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #020617;
      --card: #0f172a;
      --border: #1e293b;
      --teal: #14b8a6;
      --sky: #0ea5e9;
      --amber: #f59e0b;
      --text: #f8fafc;
      --muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: 'Plus Jakarta Sans', sans-serif;
      padding: 40px 20px;
      line-height: 1.6;
    }
    .container { max-width: 1000px; margin: 0 auto; }
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #134e4a 100%);
      padding: 32px;
      border-radius: 24px;
      border: 1px solid var(--border);
      margin-bottom: 32px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      background: rgba(20,184,166,0.15);
      color: var(--teal);
      border: 1px solid rgba(20,184,166,0.3);
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 12px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    h1 { font-size: 28px; font-weight: 800; margin-bottom: 8px; }
    p.desc { color: var(--muted); font-size: 14px; }
    .section-title {
      font-size: 18px;
      font-weight: 700;
      margin: 28px 0 16px;
      color: var(--text);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .endpoint {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 18px 24px;
      margin-bottom: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: all 0.2s ease;
    }
    .endpoint:hover { border-color: #334155; transform: translateY(-1px); }
    .endpoint-header { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .method {
      padding: 4px 10px;
      border-radius: 8px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .get { background: rgba(14,165,233,0.15); color: var(--sky); border: 1px solid rgba(14,165,233,0.3); }
    .post { background: rgba(20,184,166,0.15); color: var(--teal); border: 1px solid rgba(20,184,166,0.3); }
    .patch { background: rgba(245,158,11,0.15); color: var(--amber); border: 1px solid rgba(245,158,11,0.3); }
    .path { font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 600; color: #fff; }
    .summary { font-size: 13px; color: var(--muted); }
    .auth-tag {
      margin-left: auto;
      font-size: 11px;
      color: #64748b;
      background: #020617;
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid #1e293b;
    }
    .footer { text-align: center; margin-top: 48px; font-size: 12px; color: #64748b; }
    a.btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--teal);
      color: #020617;
      text-decoration: none;
      padding: 8px 16px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 700;
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge">Phase 2 · Production Hardened</span>
      <h1>CivicResolve REST API Specifications</h1>
      <p class="desc">Interactive documentation for the Civic Issue Resolution Platform engine. Supporting role-based RBAC, real-time Socket.IO synchronization, geospatial duplicate indexing, and SLA background automation.</p>
      <a href="/api/docs?format=json" class="btn" target="_blank">Download OpenAPI JSON Spec →</a>
    </div>

    <div class="section-title">⚡ System & Diagnostics</div>
    <div class="endpoint">
      <div class="endpoint-header">
        <span class="method get">GET</span>
        <span class="path">/api/health</span>
        <span class="auth-tag">Public</span>
      </div>
      <div class="summary">Returns server uptime, memory RSS, MongoDB connection status, and version.</div>
    </div>

    <div class="section-title">🔐 Authentication & RBAC</div>
    <div class="endpoint">
      <div class="endpoint-header">
        <span class="method post">POST</span>
        <span class="path">/api/auth/register</span>
        <span class="auth-tag">Public</span>
      </div>
      <div class="summary">Register Citizen, Field Worker, or Administrator with JWT credential rotation.</div>
    </div>
    <div class="endpoint">
      <div class="endpoint-header">
        <span class="method post">POST</span>
        <span class="path">/api/auth/login</span>
        <span class="auth-tag">Public (Rate-Limited)</span>
      </div>
      <div class="summary">Authenticate user credentials and issue Access & Refresh tokens.</div>
    </div>

    <div class="section-title">📋 Citizen Incident Lifecycle</div>
    <div class="endpoint">
      <div class="endpoint-header">
        <span class="method post">POST</span>
        <span class="path">/api/issues</span>
        <span class="auth-tag">Citizen / Staff</span>
      </div>
      <div class="summary">Create a new civic issue report with GPS coordinates and photographic evidence.</div>
    </div>
    <div class="endpoint">
      <div class="endpoint-header">
        <span class="method get">GET</span>
        <span class="path">/api/issues/my-reports</span>
        <span class="auth-tag">Citizen</span>
      </div>
      <div class="summary">Retrieve authenticated citizen's submitted reports with pagination and status filters.</div>
    </div>
    <div class="endpoint">
      <div class="endpoint-header">
        <span class="method get">GET</span>
        <span class="path">/api/issues/nearby-duplicates</span>
        <span class="auth-tag">Authenticated</span>
      </div>
      <div class="summary">Geospatial proximity query to detect nearby duplicate reports within radius R meters.</div>
    </div>
    <div class="endpoint">
      <div class="endpoint-header">
        <span class="method get">GET</span>
        <span class="path">/api/issues/public-map</span>
        <span class="auth-tag">Public</span>
      </div>
      <div class="summary">Retrieve anonymized geo-tagged markers for the public interactive Google Maps explorer.</div>
    </div>

    <div class="section-title">💬 Comments & Internal Notes</div>
    <div class="endpoint">
      <div class="endpoint-header">
        <span class="method post">POST</span>
        <span class="path">/api/issues/:id/comments</span>
        <span class="auth-tag">Authenticated</span>
      </div>
      <div class="summary">Post public discussion comment or staff confidential internal note.</div>
    </div>

    <div class="section-title">🛡️ Administrator Operations & SLA Engine</div>
    <div class="endpoint">
      <div class="endpoint-header">
        <span class="method get">GET</span>
        <span class="path">/api/admin/review-queue</span>
        <span class="auth-tag">Admin / Super Admin</span>
      </div>
      <div class="summary">Intake triage review queue with dynamic KPI counters and sorting filters.</div>
    </div>
    <div class="endpoint">
      <div class="endpoint-header">
        <span class="method post">POST</span>
        <span class="path">/api/admin/sla/check-escalations</span>
        <span class="auth-tag">Admin / Super Admin</span>
      </div>
      <div class="summary">Execute automated SLA escalation sweep across all overdue tasks.</div>
    </div>
    <div class="endpoint">
      <div class="endpoint-header">
        <span class="method get">GET</span>
        <span class="path">/api/admin/analytics</span>
        <span class="auth-tag">Admin / Super Admin</span>
      </div>
      <div class="summary">Executive operational intelligence, resolution rates, and worker leaderboards.</div>
    </div>

    <div class="footer">
      CivicResolve Platform API v2.0.0 · Designed for High Reliability & Security
    </div>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
};
