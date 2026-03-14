import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getMyCollabRequests, respondToCollab, leaveReview, sendCounterOffer, getNegotiationHistory } from '../services/apiClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Inbox, Send, Check, X, MessageSquare, Clock, Star,
  ArrowRight, AlertCircle, DollarSign, TrendingUp, TrendingDown, History,
} from 'lucide-react';

export default function CollaborationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialFilter = searchParams.get('filter') || null;
  const [tab, setTab] = useState('received');
  const [statusFilter, setStatusFilter] = useState(initialFilter);
  const [sent, setSent] = useState([]);
  const [received, setReceived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [actionLoading, setActionLoading] = useState('');

  // Negotiation state
  const [negotiateModal, setNegotiateModal] = useState(null);
  const [negotiateForm, setNegotiateForm] = useState({ proposedBudget: '', message: '' });
  const [negotiationHistory, setNegotiationHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [negotiateLoading, setNegotiateLoading] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await getMyCollabRequests();
      setSent(data.sent || []);
      setReceived(data.received || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadRequests(); }, []);

  const handleRespond = async (id, status) => {
    setActionLoading(id);
    try {
      await respondToCollab(id, { status });
      await loadRequests();
    } catch { /* ignore */ }
    setActionLoading('');
  };

  const openNegotiateModal = async (request) => {
    setNegotiateModal(request);
    setNegotiateForm({ proposedBudget: request.budgetOffered || '', message: '' });
    setHistoryLoading(true);
    try {
      const data = await getNegotiationHistory(request.id);
      setNegotiationHistory(data.messages || []);
    } catch { setNegotiationHistory([]); }
    setHistoryLoading(false);
  };

  const handleCounterOffer = async (e) => {
    e.preventDefault();
    if (!negotiateModal) return;
    setNegotiateLoading(true);
    try {
      await sendCounterOffer(negotiateModal.id, {
        proposedBudget: Number(negotiateForm.proposedBudget) || 0,
        message: negotiateForm.message,
      });
      // Refresh history
      const data = await getNegotiationHistory(negotiateModal.id);
      setNegotiationHistory(data.messages || []);
      setNegotiateForm({ proposedBudget: data.messages?.length ? data.messages[data.messages.length - 1].proposedBudget : '', message: '' });
      await loadRequests();
    } catch { /* ignore */ }
    setNegotiateLoading(false);
  };

  const handleAcceptDuringNegotiation = async () => {
    if (!negotiateModal) return;
    setNegotiateLoading(true);
    try {
      await respondToCollab(negotiateModal.id, { status: 'accepted', message: 'Deal accepted!' });
      setNegotiateModal(null);
      await loadRequests();
    } catch { /* ignore */ }
    setNegotiateLoading(false);
  };

  const handleRejectDuringNegotiation = async () => {
    if (!negotiateModal) return;
    setNegotiateLoading(true);
    try {
      await respondToCollab(negotiateModal.id, { status: 'rejected', message: 'Deal declined.' });
      setNegotiateModal(null);
      await loadRequests();
    } catch { /* ignore */ }
    setNegotiateLoading(false);
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!reviewModal) return;
    try {
      await leaveReview({
        revieweeId: reviewModal.senderId,
        collabRequestId: reviewModal.id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      setReviewModal(null);
      setReviewForm({ rating: 5, comment: '' });
    } catch { /* ignore */ }
  };

  const statusColor = (status) => {
    if (status === 'accepted') return 'var(--success)';
    if (status === 'rejected') return 'var(--error)';
    if (status === 'negotiating') return 'var(--accent)';
    return 'var(--text-muted)';
  };

  const allRequests = tab === 'received' ? received : sent;
  const requests = statusFilter
    ? allRequests.filter((r) => r.status === statusFilter)
    : allRequests;

  const formatTenure = (request) => {
    if (request.tenureDays == null) return 'Lifertime';
    if (request.tenureValue && request.tenureUnit) {
      return `${request.tenureValue} ${request.tenureUnit}`;
    }
    return `${request.tenureDays} days`;
  };

  const getDateRangeText = (request) => {
    if (request.status !== 'accepted' || !request.acceptedAt) return null;
    const start = new Date(request.acceptedAt);
    const startText = start.toLocaleDateString();
    if (request.tenureDays == null) {
      return `${startText} → Lifertime`;
    }
    const end = new Date(start);
    end.setDate(end.getDate() + Number(request.tenureDays));
    return `${startText} → ${end.toLocaleDateString()}`;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Collaborations</h1>
        <p>Manage your collaboration requests</p>
      </div>

      <div className="discover-tabs" style={{ marginBottom: 10 }}>
        <button className={`dtab ${tab === 'received' ? 'active' : ''}`} onClick={() => setTab('received')}>
          <Inbox size={16} /> Received ({received.length})
        </button>
        <button className={`dtab ${tab === 'sent' ? 'active' : ''}`} onClick={() => setTab('sent')}>
          <Send size={16} /> Sent ({sent.length})
        </button>
      </div>

      <div className="discover-tabs" style={{ marginBottom: 20 }}>
        <button className={`dtab ${!statusFilter ? 'active' : ''}`} onClick={() => setStatusFilter(null)}>
          All
        </button>
        <button className={`dtab ${statusFilter === 'pending' ? 'active' : ''}`} onClick={() => setStatusFilter('pending')}>
          <Clock size={14} /> Pending
        </button>
        <button className={`dtab ${statusFilter === 'accepted' ? 'active' : ''}`} onClick={() => setStatusFilter('accepted')}>
          <Check size={14} /> Accepted
        </button>
        <button className={`dtab ${statusFilter === 'rejected' ? 'active' : ''}`} onClick={() => setStatusFilter('rejected')}>
          <X size={14} /> Rejected
        </button>
      </div>

      {loading && <div className="card"><p className="muted">Loading...</p></div>}

      {!loading && requests.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <MessageSquare size={32} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <p className="muted">No {tab} requests yet. Head to Discover to find partners.</p>
        </div>
      )}

      <div className="collab-list">
        {requests.map((r) => {
          const otherName = tab === 'received' ? r.senderName : r.receiverName;
          const otherColor = tab === 'received' ? r.senderColor : r.receiverColor;
          const otherId = tab === 'received' ? r.senderId : r.receiverId;

          return (
            <div key={r.id} className="collab-card">
              <div className="collab-top">
                <div className="collab-avatar" style={{ background: otherColor || 'var(--accent)' }}>
                  {(otherName || '?')[0]}
                </div>
                <div className="collab-meta">
                  <h3 onClick={() => navigate(`/profile/${otherId}`)} style={{ cursor: 'pointer' }}>
                    {otherName}
                  </h3>
                  {r.campaignTitle && <span className="collab-campaign">{r.campaignTitle}</span>}
                  <span className="collab-time"><Clock size={12} /> {new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                <span className="collab-status" style={{ color: statusColor(r.status) }}>
                  {r.status}
                </span>
              </div>

              {r.message && <p className="collab-message">{r.message}</p>}

              {r.budgetOffered > 0 && (
                <span className="collab-budget">Budget: NPR {r.budgetOffered.toLocaleString()}</span>
              )}

              <span className="collab-budget">
                Tenure: {formatTenure(r)}
              </span>

              {getDateRangeText(r) && (
                <span className="collab-budget">Duration: {getDateRangeText(r)}</span>
              )}

              {/* Actions for received pending requests */}
              {tab === 'received' && r.status === 'pending' && (
                <div className="collab-actions">
                  <button
                    className="btn-accept"
                    disabled={actionLoading === r.id}
                    onClick={() => handleRespond(r.id, 'accepted')}
                  >
                    <Check size={14} /> Accept
                  </button>
                  <button
                    className="btn-negotiate"
                    disabled={actionLoading === r.id}
                    onClick={() => openNegotiateModal(r)}
                  >
                    <MessageSquare size={14} /> Negotiate
                  </button>
                  <button
                    className="btn-reject"
                    disabled={actionLoading === r.id}
                    onClick={() => handleRespond(r.id, 'rejected')}
                  >
                    <X size={14} /> Decline
                  </button>
                </div>
              )}

              {/* Negotiation actions — both sides can interact */}
              {r.status === 'negotiating' && (
                <div className="collab-actions">
                  <button className="btn-negotiate" onClick={() => openNegotiateModal(r)}>
                    <History size={14} /> View Negotiation
                  </button>
                </div>
              )}

              {/* Sender can also negotiate on pending requests they sent */}
              {tab === 'sent' && r.status === 'pending' && (
                <div className="collab-actions">
                  <span className="collab-waiting"><Clock size={14} /> Waiting for response...</span>
                </div>
              )}

              {/* Leave review button for completed collabs */}
              {r.status === 'accepted' && tab === 'received' && (
                <button className="btn-review" onClick={() => setReviewModal(r)}>
                  <Star size={14} /> Leave Review
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Review modal */}
      {reviewModal && (
        <div className="modal-overlay" onClick={() => setReviewModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Review {reviewModal.senderName}</h3>
            <form onSubmit={handleReview}>
              <label className="field">
                <span className="field-label">Rating</span>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} type="button" className={`star-btn ${reviewForm.rating >= s ? 'filled' : ''}`} onClick={() => setReviewForm((p) => ({ ...p, rating: s }))}>
                      <Star size={20} />
                    </button>
                  ))}
                </div>
              </label>
              <label className="field">
                <span className="field-label">Comment</span>
                <textarea value={reviewForm.comment} onChange={(e) => setReviewForm((p) => ({ ...p, comment: e.target.value }))} rows={3} placeholder="Share your experience..." />
              </label>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setReviewModal(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Submit Review</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Negotiation modal */}
      {negotiateModal && (
        <div className="modal-overlay" onClick={() => setNegotiateModal(null)}>
          <div className="modal-card negotiate-modal" onClick={(e) => e.stopPropagation()}>
            <div className="negotiate-header">
              <h3><MessageSquare size={18} /> Negotiation</h3>
              <p className="muted">
                {negotiateModal.campaignTitle || 'Collaboration'} with{' '}
                {tab === 'received' ? negotiateModal.senderName : negotiateModal.receiverName}
              </p>
            </div>

            {/* Current offer summary */}
            <div className="negotiate-summary">
              <div className="negotiate-summary-item">
                <span className="negotiate-label">Current Offer</span>
                <span className="negotiate-value">NPR {(negotiateModal.budgetOffered || 0).toLocaleString()}</span>
              </div>
              <div className="negotiate-summary-item">
                <span className="negotiate-label">Status</span>
                <span className="negotiate-status" style={{ color: statusColor(negotiateModal.status) }}>
                  {negotiateModal.status}
                </span>
              </div>
            </div>

            {/* Negotiation history */}
            <div className="negotiate-history">
              <h4><History size={14} /> Negotiation History</h4>
              {historyLoading && <p className="muted">Loading history...</p>}
              {!historyLoading && negotiationHistory.length === 0 && (
                <p className="muted" style={{ fontSize: '0.85rem' }}>No counter-offers yet. Be the first to propose!</p>
              )}
              {!historyLoading && negotiationHistory.map((msg) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={`negotiate-msg ${isMe ? 'mine' : 'theirs'}`}>
                    <div className="negotiate-msg-header">
                      <div className="negotiate-msg-avatar" style={{ background: msg.senderColor || 'var(--accent)' }}>
                        {(msg.senderName || '?')[0]}
                      </div>
                      <span className="negotiate-msg-name">{isMe ? 'You' : msg.senderName}</span>
                      <span className="negotiate-msg-time">{new Date(msg.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="negotiate-msg-body">
                      <div className="negotiate-msg-budget">
                        {msg.proposedBudget > (negotiateModal.budgetOffered || 0)
                          ? <TrendingUp size={14} className="budget-up" />
                          : msg.proposedBudget < (negotiateModal.budgetOffered || 0)
                          ? <TrendingDown size={14} className="budget-down" />
                          : <DollarSign size={14} />
                        }
                        NPR {(msg.proposedBudget || 0).toLocaleString()}
                      </div>
                      {msg.message && <p className="negotiate-msg-text">{msg.message}</p>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Counter-offer form (only if still negotiable) */}
            {(negotiateModal.status === 'pending' || negotiateModal.status === 'negotiating') && (
              <form onSubmit={handleCounterOffer} className="negotiate-form">
                <h4><DollarSign size={14} /> Make a Counter-Offer</h4>
                <label className="field">
                  <span className="field-label">Proposed Budget (NPR)</span>
                  <input
                    type="number"
                    min="0"
                    value={negotiateForm.proposedBudget}
                    onChange={(e) => setNegotiateForm((p) => ({ ...p, proposedBudget: e.target.value }))}
                    placeholder="Enter your proposed amount"
                    required
                  />
                </label>
                <label className="field">
                  <span className="field-label">Message</span>
                  <textarea
                    value={negotiateForm.message}
                    onChange={(e) => setNegotiateForm((p) => ({ ...p, message: e.target.value }))}
                    rows={2}
                    placeholder="Explain your offer..."
                  />
                </label>
                <div className="negotiate-actions">
                  <button type="submit" className="btn-negotiate" disabled={negotiateLoading}>
                    <Send size={14} /> {negotiateLoading ? 'Sending...' : 'Send Counter-Offer'}
                  </button>
                  <button type="button" className="btn-accept" disabled={negotiateLoading} onClick={handleAcceptDuringNegotiation}>
                    <Check size={14} /> Accept Deal
                  </button>
                  <button type="button" className="btn-reject" disabled={negotiateLoading} onClick={handleRejectDuringNegotiation}>
                    <X size={14} /> Walk Away
                  </button>
                </div>
              </form>
            )}

            {/* Resolved state */}
            {negotiateModal.status !== 'pending' && negotiateModal.status !== 'negotiating' && (
              <div className="negotiate-resolved">
                <AlertCircle size={16} />
                <span>This negotiation has been <strong>{negotiateModal.status}</strong>.</span>
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setNegotiateModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
