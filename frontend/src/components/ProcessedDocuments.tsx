import React, { useState, useEffect } from 'react';
import { fetchDocuments } from '../utils/api';
import type { ProcessedDocument } from '../utils/api';

interface Props {
  onInspectRecord?: (doc: ProcessedDocument) => void;
  refreshTrigger?: number;
}

export const ProcessedDocuments: React.FC<Props> = ({ onInspectRecord, refreshTrigger = 0 }) => {
  const [docs, setDocs] = useState<ProcessedDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchDocuments(undefined, undefined, limit, offset);
      setDocs(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch documents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, [offset, refreshTrigger]);

  const handlePrev = () => setOffset((o) => Math.max(0, o - limit));
  const handleNext = () => setOffset((o) => (o + limit < total ? o + limit : o));

  return (
    <div className="view-panel">
      <div className="card">
        <h3 className="card-title">Processed Documents</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Uploaded PDFs, images and text documents processed by the pipeline.
        </p>
      </div>

      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>ID</th>
                <th>Source File</th>
                <th>Type</th>
                <th>Language</th>
                <th>Summary</th>
                <th style={{ width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td><div className="skeleton-text" style={{ width: 30 }} /></td>
                    <td><div className="skeleton-text" style={{ width: 140 }} /></td>
                    <td><div className="skeleton-text" style={{ width: 60 }} /></td>
                    <td><div className="skeleton-text" style={{ width: 80 }} /></td>
                    <td><div className="skeleton-text" style={{ width: 220 }} /></td>
                    <td><div className="skeleton-text" style={{ width: 60 }} /></td>
                  </tr>
                ))
              ) : docs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    No processed documents found. Upload a PDF, image, or text file to see results here.
                  </td>
                </tr>
              ) : (
                docs.map((d) => (
                  <tr key={d.id} className="row-clickable">
                    <td><b>#{d.id}</b></td>
                    <td style={{ color: 'var(--accent-light)', fontWeight: 500 }}>{d.source_file}</td>
                    <td>{d.document_type}</td>
                    <td>{d.language}</td>
                    <td style={{ maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.summary}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                        onClick={() => onInspectRecord?.(d)}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && docs.length > 0 && (
          <div className="pagination" style={{ marginTop: '12px' }}>
            <span className="pagination-info">Showing {Math.floor(offset / limit) + 1} of {Math.ceil(total / limit) || 1}</span>
            <div className="pagination-controls">
              <button className="btn btn-secondary" onClick={handlePrev} disabled={offset === 0}>Previous</button>
              <button className="btn btn-secondary" onClick={handleNext} disabled={offset + limit >= total}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
