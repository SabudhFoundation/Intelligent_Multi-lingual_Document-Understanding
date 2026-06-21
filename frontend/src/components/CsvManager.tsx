import React, { useState, useRef } from 'react';
import { uploadCsvFile, importCsvFromPath, uploadDocument } from '../utils/api';
import type { CsvImportResponse } from '../utils/api';

interface CsvManagerProps {
  onImportSuccess?: () => void;
}

interface ImportLog {
  id: string;
  timestamp: string;
  fileName: string;
  inserted: number;
  updated: number;
  status: 'success' | 'error';
  message: string;
}

export const CsvManager: React.FC<CsvManagerProps> = ({ onImportSuccess }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDocDragActive, setIsDocDragActive] = useState(false);
  const [isDocUploading, setIsDocUploading] = useState(false);
  const [serverPath, setServerPath] = useState('');
  const [serverSourceName, setServerSourceName] = useState('');
  const [isPathImporting, setIsPathImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [logs, setLogs] = useState<ImportLog[]>([]);

  const csvInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const addLog = (fileName: string, inserted: number, updated: number, status: 'success' | 'error', message: string) => {
    const newLog: ImportLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      fileName,
      inserted,
      updated,
      status,
      message,
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await uploadFile(file);
    }
  };

  const handleDocumentDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDocDragActive(false);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await uploadDocumentFile(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await uploadFile(file);
    }
  };

  const handleDocumentFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await uploadDocumentFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrorMsg('Invalid file format. Please upload a .csv file.');
      addLog(file.name, 0, 0, 'error', 'Invalid file format. Please upload a .csv file.');
      return;
    }

    setIsUploading(true);
    try {
      const res = await uploadCsvFile(file);
      setSuccessMsg(`Successfully uploaded ${res.source_file}: Inserted ${res.inserted} row(s), Updated ${res.updated} row(s).`);
      addLog(res.source_file, res.inserted, res.updated, 'success', 'Imported successfully.');
      onImportSuccess?.();
      if (csvInputRef.current) csvInputRef.current.value = '';
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload CSV');
      addLog(file.name, 0, 0, 'error', err.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const uploadDocumentFile = async (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const allowed = ['txt', 'pdf', 'png', 'jpg', 'jpeg'];
    if (!extension || !allowed.includes(extension)) {
      setErrorMsg('Invalid document format. Please upload .txt, .pdf, .png, .jpg, or .jpeg.');
      addLog(file.name, 0, 0, 'error', 'Invalid document format.');
      return;
    }

    setIsDocUploading(true);
    try {
      const res = await uploadDocument(file);
      setSuccessMsg(`Document processed: ${res.source_file} (${res.document_type}, ${res.language})`);
      addLog(res.source_file, 0, 0, 'success', `Processed document with type ${res.document_type}.`);
      onImportSuccess?.();
      if (documentInputRef.current) documentInputRef.current.value = '';
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process document');
      addLog(file.name, 0, 0, 'error', err.message || 'Document upload failed.');
    } finally {
      setIsDocUploading(false);
    }
  };

  const handlePathImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverPath.trim()) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsPathImporting(true);

    try {
      const res = await importCsvFromPath(serverPath.trim(), serverSourceName.trim() || undefined);
      setSuccessMsg(`Successfully imported local CSV from path: Inserted ${res.inserted} row(s), Updated ${res.updated} row(s).`);
      addLog(res.source_file, res.inserted, res.updated, 'success', 'Imported from local path.');
      onImportSuccess?.();
      setServerPath('');
      setServerSourceName('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to import path');
      addLog(serverSourceName || 'Local Path', 0, 0, 'error', err.message || 'Local path import failed.');
    } finally {
      setIsPathImporting(false);
    }
  };

  const triggerFileSelect = () => {
    csvInputRef.current?.click();
  };

  return (
    <div className="view-panel">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Upload Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* File Upload Zone */}
          <div className="card">
            <h3 className="card-title">Upload CSV File</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Drag and drop any standard CSV spreadsheet here to parse its rows into the document repository.
            </p>

            <input
              type="file"
              ref={csvInputRef}
              onChange={handleFileChange}
              accept=".csv"
              aria-label="Select CSV file to upload"
              style={{ display: 'none' }}
            />

            <div
              className={`dropzone ${isDragActive ? 'active' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => csvInputRef.current?.click()}
            >
              <div className="dropzone-icon">
                {isUploading ? (
                  <div className="spinner" style={{ width: '40px', height: '40px' }} />
                ) : (
                  <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                )}
              </div>
              <p style={{ fontWeight: 600 }}>
                {isUploading ? 'Uploading and processing...' : 'Drag & Drop CSV file here'}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                or click to browse local files
              </p>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">Upload Document (PDF / Image / Text)</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Drag and drop a PDF, image, or text document to process it through the multilingual document understanding pipeline.
            </p>

            <input
              type="file"
              ref={documentInputRef}
              onChange={handleDocumentFileChange}
              accept=".txt,.pdf,.png,.jpg,.jpeg"
              aria-label="Select document file to process"
              style={{ display: 'none' }}
            />

            <div
              className={`dropzone ${isDocDragActive ? 'active' : ''}`}
              onDragEnter={handleDocumentDrop}
              onDragOver={handleDocumentDrop}
              onDragLeave={() => setIsDocDragActive(false)}
              onDrop={handleDocumentDrop}
              onClick={() => documentInputRef.current?.click()}
            >
              <div className="dropzone-icon">
                {isDocUploading ? (
                  <div className="spinner" style={{ width: '40px', height: '40px' }} />
                ) : (
                  <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                )}
              </div>
              <p style={{ fontWeight: 600 }}>
                {isDocUploading ? 'Uploading and processing...' : 'Drag & Drop document here'}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                or click to choose a PDF, image, or text file
              </p>
            </div>
          </div>

          {/* Local Server Path Import */}
          <div className="card">
            <h3 className="card-title">Import Server-Side CSV</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
              If your CSV document is already stored on the hosting server, specify its full absolute path to import it without web uploading.
            </p>

            <form onSubmit={handlePathImportSubmit}>
              <div className="form-group">
                <label htmlFor="csv-path">CSV File Absolute Path</label>
                <input
                  id="csv-path"
                  type="text"
                  className="input-field"
                  placeholder="e.g. E:\project_sabudh\sample_data.csv"
                  value={serverPath}
                  onChange={(e) => setServerPath(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="source-name">Override Source Name (Optional)</label>
                <input
                  id="source-name"
                  type="text"
                  className="input-field"
                  placeholder="e.g. custom_data_source"
                  value={serverSourceName}
                  onChange={(e) => setServerSourceName(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '8px' }}
                disabled={isPathImporting || !serverPath.trim()}
              >
                {isPathImporting ? (
                  <>
                    <div className="spinner" style={{ width: '16px', height: '16px' }} />
                    Importing...
                  </>
                ) : (
                  'Run Path Import'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Feedback & Import Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Notifications */}
          {(successMsg || errorMsg) && (
            <div className="card" style={{ padding: '16px' }}>
              {successMsg && <div className="alert alert-success">{successMsg}</div>}
              {errorMsg && <div className="alert alert-error">{errorMsg}</div>}
            </div>
          )}

          {/* Import History log */}
          <div className="card" style={{ flex: 1 }}>
            <h3 className="card-title">Import Activity Logs</h3>
            <div style={{ maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              {logs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No files imported or documents processed in this session.
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--border-radius-sm)',
                      background: 'hsla(222, 25%, 10%, 0.5)',
                      border: `1px solid ${log.status === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', wordBreak: 'break-all' }}>{log.fileName}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.timestamp}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: log.status === 'success' ? 'var(--success)' : 'var(--error)' }}>
                      {log.message}
                    </p>
                    {log.status === 'success' && (
                      <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span>Inserted: <b>{log.inserted}</b></span>
                        <span>Updated: <b>{log.updated}</b></span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
