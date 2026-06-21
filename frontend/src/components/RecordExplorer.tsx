import React, { useState, useEffect, useCallback } from 'react';
import { fetchRecords } from '../utils/api';
import type { CsvRecord } from '../utils/api';

interface RecordExplorerProps {
  onSelectRecord?: (recordId: number) => void;
  refreshTrigger?: number;
}

export const RecordExplorer: React.FC<RecordExplorerProps> = ({
  onSelectRecord,
  refreshTrigger = 0,
}) => {
  const [records, setRecords] = useState<CsvRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [limit] = useState(25);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected record for details drawer
  const [selectedRecord, setSelectedRecord] = useState<CsvRecord | null>(null);

  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchRecords(
        search.trim() || undefined,
        sourceFilter.trim() || undefined,
        limit,
        offset
      );
      setRecords(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch records');
    } finally {
      setIsLoading(false);
    }
  }, [search, sourceFilter, limit, offset]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords, refreshTrigger]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0); // Reset page
  };

  const handlePrevPage = () => {
    if (offset >= limit) {
      setOffset(offset - limit);
    }
  };

  const handleNextPage = () => {
    if (offset + limit < total) {
      setOffset(offset + limit);
    }
  };

  // Determine dynamic columns based on loaded records
  // We scan the first few records to find unique CSV keys to show as columns
  const getDynamicKeys = () => {
    const keysSet = new Set<string>();
    records.slice(0, 10).forEach((rec) => {
      if (rec.data) {
        Object.keys(rec.data).forEach((k) => keysSet.add(k));
      }
    });
    return Array.from(keysSet).slice(0, 4); // Limit to first 4 custom fields to prevent overflow
  };

  const dynamicKeys = getDynamicKeys();
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit) || 1;

  const handleRowClick = (rec: CsvRecord) => {
    setSelectedRecord(rec);
    if (onSelectRecord) {
      onSelectRecord(rec.id);
    }
  };

  return (
    <div className="view-panel">
      {/* Search and Filters Bar */}
      <div className="card">
        <form onSubmit={handleSearchSubmit} className="search-container">
          <div style={{ flex: 2 }}>
            <input
              type="text"
              className="input-field"
              placeholder="Search keyword in records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              className="input-field"
              placeholder="Filter by source filename..."
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            Apply Filters
          </button>
        </form>
      </div>

      {/* Records Table */}
      <div className="card" style={{ padding: 0 }}>
        {error && <div className="alert alert-error" style={{ margin: '16px' }}>{error}</div>}

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ID</th>
                <th>Source File</th>
                <th style={{ width: '80px' }}>Row</th>
                {dynamicKeys.map((key) => (
                  <th key={key}>{key}</th>
                ))}
                {dynamicKeys.length === 0 && <th>Record Data (JSON)</th>}
                <th style={{ width: '100px', textAlign: 'center' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // Loading Skeleton Rows
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx}>
                    <td><div className="skeleton-text" style={{ width: '30px' }} /></td>
                    <td><div className="skeleton-text" style={{ width: '120px' }} /></td>
                    <td><div className="skeleton-text" style={{ width: '30px' }} /></td>
                    {dynamicKeys.map((key) => (
                      <td key={key}><div className="skeleton-text" style={{ width: '80px' }} /></td>
                    ))}
                    {dynamicKeys.length === 0 && (
                      <td><div className="skeleton-text" style={{ width: '200px' }} /></td>
                    )}
                    <td style={{ textAlign: 'center' }}><div className="skeleton-text" style={{ width: '50px', margin: '0 auto' }} /></td>
                  </tr>
                ))
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={3 + Math.max(1, dynamicKeys.length) + 1} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    No matching database records found. Try uploading a CSV or changing filters.
                  </td>
                </tr>
              ) : (
                records.map((rec) => (
                  <tr
                    key={rec.id}
                    className="row-clickable"
                    onClick={() => handleRowClick(rec)}
                  >
                    <td><b>#{rec.id}</b></td>
                    <td style={{ color: 'var(--accent-light)', fontWeight: 500 }}>{rec.source_file}</td>
                    <td>{rec.row_number}</td>
                    {dynamicKeys.map((key) => (
                      <td key={key}>
                        {rec.data && rec.data[key] !== undefined
                          ? typeof rec.data[key] === 'object'
                            ? JSON.stringify(rec.data[key])
                            : String(rec.data[key])
                          : '-'}
                      </td>
                    ))}
                    {dynamicKeys.length === 0 && (
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {JSON.stringify(rec.data)}
                      </td>
                    )}
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(rec);
                        }}
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

        {/* Pagination controls */}
        {!isLoading && records.length > 0 && (
          <div className="pagination">
            <span className="pagination-info">
              Showing page <b>{currentPage}</b> of <b>{totalPages}</b> (Total: {total} records)
            </span>
            <div className="pagination-controls">
              <button
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                onClick={handlePrevPage}
                disabled={offset === 0}
              >
                Previous
              </button>
              <button
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                onClick={handleNextPage}
                disabled={offset + limit >= total}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details slide-out drawer */}
      {selectedRecord && (
        <>
          <div className="drawer-backdrop" onClick={() => setSelectedRecord(null)} />
          <div className="drawer">
            <div className="drawer-header">
              <div className="drawer-title">
                Record #{selectedRecord.id} Details
              </div>
              <button className="drawer-close" onClick={() => setSelectedRecord(null)}>
                &times;
              </button>
            </div>

            <div className="details-grid">
              <div className="detail-row">
                <span className="detail-key">Source File Name</span>
                <span className="detail-value" style={{ fontWeight: 600, color: 'var(--accent-light)' }}>
                  {selectedRecord.source_file}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Original Row Number</span>
                <span className="detail-value">{selectedRecord.row_number}</span>
              </div>
              {selectedRecord.created_at && (
                <div className="detail-row">
                  <span className="detail-key">Imported Timestamp</span>
                  <span className="detail-value">
                    {new Date(selectedRecord.created_at).toLocaleString()}
                  </span>
                </div>
              )}

              <div style={{ marginTop: '12px' }}>
                <span className="detail-key" style={{ display: 'block', marginBottom: '8px' }}>
                  Parsed Columns & Values
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.entries(selectedRecord.data || {}).map(([key, val]) => (
                    <div
                      key={key}
                      style={{
                        padding: '10px 12px',
                        background: 'hsla(222, 25%, 8%, 0.5)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--border-radius-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                      }}
                    >
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        {key}
                      </span>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                        {typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '12px' }}>
                <span className="detail-key" style={{ display: 'block', marginBottom: '8px' }}>
                  Raw JSON Payload
                </span>
                <pre className="json-block">
                  {JSON.stringify(selectedRecord.data, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
