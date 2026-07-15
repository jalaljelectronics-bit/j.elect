// src/pages/ClientQueries.tsx
import React, { useEffect, useState } from 'react';
import {
  getQueries,
  updateQueryStatus,
  deleteQuery,
  ClientQuery
} from '../api/queryService';

export const ClientQueries: React.FC = () => {
  const [queries, setQueries] = useState<ClientQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuery, setSelectedQuery] = useState<ClientQuery | null>(null);

  const loadQueries = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getQueries();
      setQueries(data);
    } catch (err) {
      setError('Could not load client queries. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueries();
  }, []);

  const handleStatusChange = async (id: string, newStatus: ClientQuery['status']) => {
    const previous = queries;
    setQueries(prev => prev.map(q => q.id === id ? { ...q, status: newStatus } : q));
    if (selectedQuery && selectedQuery.id === id) {
      setSelectedQuery(prev => prev ? { ...prev, status: newStatus } : null);
    }
    try {
      await updateQueryStatus(id, newStatus);
    } catch (err) {
      setQueries(previous);
      alert('Failed to update status. Please try again.');
    }
  };

  const handleDeleteQuery = async (id: string) => {
    if (!window.confirm(`Permanently remove client ticket records for "${id}"?`)) return;
    try {
      await deleteQuery(id);
      setQueries(prev => prev.filter(q => q.id !== id));
      setSelectedQuery(null);
    } catch (err) {
      alert('Failed to delete query. Please try again.');
    }
  };

  return (
    <div>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>Client Support Tickets</h1>
        <p style={{ color: '#64748b', marginTop: '0.25rem' }}>Review buyer messages, manage priority queues, and update customer ticket logs.</p>
      </div>

      {loading && (
        <div style={{ padding: '2rem', color: '#64748b' }}>Loading queries...</div>
      )}

      {!loading && error && (
        <div style={{ padding: '1rem', marginTop: '1.5rem', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '0.5rem' }}>
          {error}{' '}
          <button onClick={loadQueries} style={{ textDecoration: 'underline', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && queries.length === 0 && (
        <div style={{ padding: '2rem', color: '#64748b' }}>No client queries yet.</div>
      )}

      {!loading && !error && queries.length > 0 && (
        <div className="table-wrap" style={{ backgroundColor: '#fff', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflowX: 'auto', marginTop: '2rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '1rem', color: '#64748b', fontWeight: '600' }}>Ticket ID</th>
                <th style={{ padding: '1rem', color: '#64748b', fontWeight: '600' }}>Client</th>
                <th style={{ padding: '1rem', color: '#64748b', fontWeight: '600' }}>Subject</th>
                <th style={{ padding: '1rem', color: '#64748b', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '1rem', color: '#64748b', fontWeight: '600', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {queries.map(q => (
                <tr key={q.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem', fontWeight: '600', color: '#3b82f6', cursor: 'pointer' }} onClick={() => setSelectedQuery(q)}>
                    QRY-{q.id}
                  </td>
                  <td style={{ padding: '1rem', color: '#0f172a', fontWeight: '500' }}>{q.clientName}</td>
                  <td style={{ padding: '1rem', color: '#475569' }}>{q.subject}</td>

                  <td style={{ padding: '1rem' }}>
                    <span style={{ padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: q.status === 'Unread' ? '#fee2e2' : q.status === 'In Progress' ? '#e0f2fe' : '#dcfce7', color: q.status === 'Unread' ? '#ef4444' : q.status === 'In Progress' ? '#0284c7' : '#16a34a' }}>
                      {q.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button onClick={() => setSelectedQuery(q)} style={{ padding: '0.375rem 0.75rem', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' }}>
                        Review Message
                      </button>
                      <button onClick={() => handleDeleteQuery(q.id)} style={{ padding: '0.375rem 0.625rem', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Query Detail Modal Drawer Layout */}
      {selectedQuery && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="modal-card modal-pad" style={{ backgroundColor: '#fff', borderRadius: '0.5rem', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', boxSizing: 'border-box', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Ticket Log: QRY-{selectedQuery.id}</h3>
              <button onClick={() => setSelectedQuery(null)} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
            </div>

            <div style={{ marginBottom: '1.25rem', fontSize: '0.875rem', color: '#334155', lineHeight: '1.6' }}>
              <div>👤 <strong>Sender Name:</strong> {selectedQuery.clientName}</div>
              <div>✉️ <strong>Email Link:</strong> <a href={`mailto:${selectedQuery.clientEmail}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>{selectedQuery.clientEmail}</a></div>
              <div>📅 <strong>Sent Date:</strong> {selectedQuery.date}</div>
              <div>📌 <strong>Subject Core:</strong> {selectedQuery.subject}</div>
              <div>🚩 <strong>Priority:</strong> {selectedQuery.priority}</div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '1.25rem', borderRadius: '0.375rem', marginBottom: '1.5rem', fontSize: '0.925rem', color: '#0f172a', whiteSpace: 'pre-line' }}>
              <strong>Client Message Content:</strong><br/>
              {selectedQuery.message}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
              <div>
                <label style={{ marginRight: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Fulfillment State:</label>
                <select value={selectedQuery.status} onChange={(e) => handleStatusChange(selectedQuery.id, e.target.value as ClientQuery['status'])} style={{ padding: '0.375rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1' }}>
                  <option value="Unread">Unread</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
              <button onClick={() => setSelectedQuery(null)} style={{ padding: '0.5rem 1rem', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '0.375rem', color: '#1e293b', fontWeight: '500', cursor: 'pointer' }}>
                Close Details
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};