import React from 'react';

interface DashboardProps {
  totalRecords: number;
  uniqueFilesCount: number;
  isBackendOnline: boolean;
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  totalRecords,
  uniqueFilesCount,
  isBackendOnline,
  onNavigate,
}) => {
  return (
    <div className="view-panel">
      {/* Welcome Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)', border: '1px solid rgba(124, 58, 237, 0.25)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', marginBottom: '8px' }}>
          Intelligent Multilingual Document Understanding Portal
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '800px', fontSize: '0.95rem' }}>
          Welcome back! This system stores and processes documents in multiple languages (including English, Hindi, Bengali, Punjabi, and Malayalam). You can upload CSV tables, search records, or use natural language to chat with your document repository.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-box success">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="metric-details">
            <span className="metric-label">Stored Records</span>
            <span className="metric-value">{totalRecords.toLocaleString()}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box accent">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div className="metric-details">
            <span className="metric-label">Source Files</span>
            <span className="metric-value">{uniqueFilesCount}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className={`metric-icon-box ${isBackendOnline ? 'success' : 'warning'}`}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="metric-details">
            <span className="metric-label">Engine Status</span>
            <span className="metric-value">{isBackendOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
        </div>
      </div>

      {/* Grid of details */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Quick Actions Panel */}
        <div className="card">
          <h3 className="card-title">Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '16px' }}>
            <div 
              className="card" 
              style={{ cursor: 'pointer', background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', padding: '16px', transition: 'border-color 0.2s' }}
              onClick={() => onNavigate('upload')}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            >
              <h4 style={{ fontFamily: 'var(--font-display)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Data Ingestion
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Upload CSV datasets, PDFs, images, or raw text documents for parsing.</p>
            </div>

            <div 
              className="card" 
              style={{ cursor: 'pointer', background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', padding: '16px', transition: 'border-color 0.2s' }}
              onClick={() => onNavigate('documents')}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            >
              <h4 style={{ fontFamily: 'var(--font-display)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Document Library
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Browse and inspect multilingual processed documents and OCR texts.</p>
            </div>

            <div 
              className="card" 
              style={{ cursor: 'pointer', background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', padding: '16px', transition: 'border-color 0.2s' }}
              onClick={() => onNavigate('explore')}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            >
              <h4 style={{ fontFamily: 'var(--font-display)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Record Explorer
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Search, filter, and inspect specific data rows and database fields.</p>
            </div>

            <div 
              className="card" 
              style={{ cursor: 'pointer', background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', padding: '16px', transition: 'border-color 0.2s' }}
              onClick={() => onNavigate('chat')}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            >
              <h4 style={{ fontFamily: 'var(--font-display)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                AI Assistant
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Query your databases and documents using natural language chat.</p>
            </div>
          </div>
        </div>

        {/* System Stats panel */}
        <div className="card">
          <h3 className="card-title">System Info</h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', fontSize: '0.85rem' }}>
            <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Database Type</span>
              <span style={{ fontWeight: 600 }}>PostgreSQL</span>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>API Engine</span>
              <span style={{ fontWeight: 600 }}>FastAPI (Uvicorn)</span>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>LLM Integrator</span>
              <span style={{ fontWeight: 600 }}>LangChain + OpenAI</span>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Supported Languages</span>
              <span style={{ fontWeight: 600, color: 'var(--accent-light)', textAlign: 'right' }}>
                English, Hindi, Bengali, Punjabi, Malayalam
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
