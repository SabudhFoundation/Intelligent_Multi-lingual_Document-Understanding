import React, { useState, useEffect } from 'react';
import { checkHealth, fetchRecords } from './utils/api';
import type { CsvRecord, ProcessedDocument } from './utils/api';
import { Dashboard } from './components/Dashboard';
import { CsvManager } from './components/CsvManager';
import { RecordExplorer } from './components/RecordExplorer';
import { ChatAssistant } from './components/ChatAssistant';
import { ProcessedDocuments } from './components/ProcessedDocuments';

type Tab = 'dashboard' | 'upload' | 'explore' | 'documents' | 'chat';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [uniqueFilesCount, setUniqueFilesCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Global details drawer state (e.g. when chat references a document)
  const [inspectingRecord, setInspectingRecord] = useState<ProcessedDocument | null>(null);

  const refreshStats = async () => {
    try {
      const health = await checkHealth();
      setIsBackendOnline(health.status === 'ok' && health.database === 'connected');
    } catch {
      setIsBackendOnline(false);
    }

    try {
      // Fetch recent 200 records to extract metrics
      const recordsRes = await fetchRecords(undefined, undefined, 200, 0);
      setTotalRecords(recordsRes.total);

      const files = new Set<string>();
      recordsRes.items.forEach((item) => {
        if (item.source_file) {
          files.add(item.source_file);
        }
      });
      setUniqueFilesCount(files.size);
    } catch {
      // Ignore record fetch errors if DB is not seeded yet
    }
  };

  // Initial load and periodic stats update
  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 8000); // Poll every 8s
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const handleImportSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return { title: 'Analytics Dashboard', desc: 'Real-time database metrics and engine health.' };

      case 'upload':
        return { title: 'Data Ingestion Hub', desc: 'Upload CSV datasets, PDFs, images, or text documents for parsing.' };

      case 'explore':
        return { title: 'Record Explorer', desc: 'Browse and search individual columns and raw database rows.' };

      case 'documents':
        return { title: 'Document Library', desc: 'Browse and inspect processed documents, PDFs, images, and OCR text.' };

      case 'chat':
        return { title: 'AI Query Assistant', desc: 'Ask natural language questions about your documents using RAG.' };

      default:
        return { title: '', desc: '' };
    }
  };

  const headerInfo = getHeaderTitle();

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon"></div>
            <div className="logo-text">
              LinguaDocs AI
            </div>
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          <ul className="sidebar-menu">
            <li
              className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: '4px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
              </svg>
              Dashboard
            </li>
            <li
              className={`menu-item ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: '4px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Data Ingestion
            </li>
            <li
              className={`menu-item ${activeTab === 'documents' ? 'active' : ''}`}
              onClick={() => setActiveTab('documents')}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: '4px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Document Library
            </li>
            <li
              className={`menu-item ${activeTab === 'explore' ? 'active' : ''}`}
              onClick={() => setActiveTab('explore')}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: '4px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Record Explorer
            </li>
            <li
              className={`menu-item ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: '4px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              AI Assistant
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="status-card">
            <div className="status-info">
              <span className={`status-indicator ${isBackendOnline ? 'online' : 'offline'}`} />
              <span className="status-label">Database Connection</span>
            </div>
            <span className="status-value" style={{ color: isBackendOnline ? 'var(--success)' : 'var(--error)' }}>
              {isBackendOnline ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Panel View Area */}
      <main className="main-content">
        <header className="main-header">
          <div className="header-title">
            <h1>{headerInfo.title}</h1>
            <p>{headerInfo.desc}</p>
          </div>
        </header>

        {/* Tab Routing */}
        {activeTab === 'dashboard' && (
          <Dashboard
            totalRecords={totalRecords}
            uniqueFilesCount={uniqueFilesCount}
            isBackendOnline={isBackendOnline}
            onNavigate={(tab) => setActiveTab(tab as Tab)}
          />
        )}
        {activeTab === 'upload' && (
          <CsvManager onImportSuccess={handleImportSuccess} />
        )}
        {activeTab === 'explore' && (
          <RecordExplorer refreshTrigger={refreshTrigger} />
        )}
        {activeTab === 'documents' && (
          <ProcessedDocuments refreshTrigger={refreshTrigger} onInspectRecord={(rec) => setInspectingRecord(rec)} />
        )}
        {activeTab === 'chat' && (
          <ChatAssistant onInspectRecord={(rec) => setInspectingRecord(rec)} />
        )}
      </main>

      {/* Global Inspectors/Drawers */}
      {inspectingRecord && (
        <>
          <div className="drawer-backdrop" onClick={() => setInspectingRecord(null)} />
          <div className="drawer">
            <div className="drawer-header">
              <div className="drawer-title">
                Record #{inspectingRecord.id} Details (AI Referenced)
              </div>
              <button className="drawer-close" onClick={() => setInspectingRecord(null)}>
                &times;
              </button>
            </div>

            <div className="details-grid">
              <div className="detail-row">
                <span className="detail-key">Source File Name</span>
                <span className="detail-value">
                  {inspectingRecord.source_file}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Document Type</span>
                <span className="detail-value">{inspectingRecord.document_type}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Language</span>
                <span className="detail-value">{inspectingRecord.language}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Summary</span>
                <span className="detail-value">{inspectingRecord.summary}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Extracted Text</span>
                <pre className="json-block">
                  {inspectingRecord.extracted_text}
                </pre>
              </div>
              <div className="detail-row">
                <span className="detail-key">Masked Text</span>
                <pre className="json-block">
                  {inspectingRecord.masked_text}
                </pre>
              </div>
              <div className="detail-row">
                <span className="detail-key">Entities</span>
                <pre className="json-block">
                  {JSON.stringify(inspectingRecord.entities, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
