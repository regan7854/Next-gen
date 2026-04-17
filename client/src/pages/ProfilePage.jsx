import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchProfile, getPublicProfile, sendCollabRequest, getMyCampaigns, addCampaign, deleteCampaign, getReviewsFor } from '../services/apiClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  MapPin, Instagram, Youtube, Hash, Star, Send, Globe, Tag,
  DollarSign, Users, Target, Briefcase, Plus, Trash2, Award,
  BarChart3, Eye, Heart, Calendar, Edit3, Megaphone,
} from 'lucide-react';

function formatNum(n) {
  if (!n) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

export default function ProfilePage() {
  const { userId } = useParams();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const isOwn = !userId || userId === authUser?.id;

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [reviews, setReviews] = useState({ reviews: [], avgRating: null, reviewCount: 0 });
  const [showCollabForm, setShowCollabForm] = useState(false);
  const [collabForm, setCollabForm] = useState({
    message: '',
    campaignTitle: '',
    budgetOffered: '',
    tenureType: 'fixed',
    tenureValue: '20',
    tenureUnit: 'days',
  });
  const [collabSent, setCollabSent] = useState(false);
  const [collabError, setCollabError] = useState('');
  const [showAddCampaign, setShowAddCampaign] = useState(false);
  const [campaignForm, setCampaignForm] = useState({ title: '', description: '', platform: '', resultsSummary: '', reach: '', engagement: '' });
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (isOwn) {
          const { user: u } = await fetchProfile();
          const targetId = u.id;
          const pub = await getPublicProfile(targetId);
          setProfileData(pub);
          const campData = await getMyCampaigns().catch(() => ({ campaigns: [] }));
          setCampaigns(campData.campaigns || []);
          const revData = await getReviewsFor(targetId).catch(() => ({ reviews: [], avgRating: null, reviewCount: 0 }));
          setReviews(revData);
        } else {
          const pub = await getPublicProfile(userId);
          setProfileData(pub);
          const revData = await getReviewsFor(userId).catch(() => ({ reviews: [], avgRating: null, reviewCount: 0 }));
          setReviews(revData);
        }
      } catch (err) {
        console.error('ProfilePage load error:', err);
        setError(err.response?.data?.message || 'Failed to load profile');
      }
      setLoading(false);
    })();
  }, [userId]);

  const handleSendCollab = async (e) => {
    e.preventDefault();
    setCollabError('');
    if (collabForm.tenureType === 'fixed') {
      const v = Number(collabForm.tenureValue);
      if (!Number.isInteger(v) || v < 1) {
        setCollabError('Tenure value must be a positive whole number');
        return;
      }
    }
    try {
      await sendCollabRequest({
        receiverId: userId,
        ...collabForm,
        budgetOffered: Number(collabForm.budgetOffered) || 0,
        tenureType: collabForm.tenureType,
        tenureValue: Number(collabForm.tenureValue) || 0,
        tenureUnit: collabForm.tenureUnit,
      });
      setCollabSent(true);
      setShowCollabForm(false);
    } catch (err) {
      setCollabError(err.response?.data?.message || 'Failed to send request');
    }
  };

  const handleAddCampaign = async (e) => {
    e.preventDefault();
    try {
      await addCampaign({
        ...campaignForm,
        reach: Number(campaignForm.reach) || 0,
        engagement: Number(campaignForm.engagement) || 0,
      });
      const campData = await getMyCampaigns();
      setCampaigns(campData.campaigns || []);
      setShowAddCampaign(false);
      setCampaignForm({ title: '', description: '', platform: '', resultsSummary: '', reach: '', engagement: '' });
    } catch { /* ignore */ }
  };

  const handleDeleteCampaign = async (id) => {
    try {
      await deleteCampaign(id);
      setCampaigns((c) => c.filter((x) => x.id !== id));
    } catch { /* ignore */ }
  };

  if (loading) return <div className="page-container"><p className="muted">Loading profile...</p></div>;
  if (error) return <div className="page-container"><p className="muted">{error}</p></div>;
  if (!profileData) return <div className="page-container"><p className="muted">Profile not found</p></div>;

  const { user: pUser, profile, rating, reviewCount } = profileData;
  const initial = pUser.displayName?.[0]?.toUpperCase() || '?';
  const isInfluencer = pUser.role === 'influencer';
  const isBrand = pUser.role === 'brand';

  return (
    <div className="page-container">
      {/* Header card */}
      <div className="profile-header-card">
        <div className="profile-avatar-xl" style={{ background: pUser.avatarColor || 'var(--accent)' }}>
          {initial}
        </div>
        <div className="profile-header-info">
          <h1>{pUser.displayName}</h1>
          <div className="profile-header-meta">
            {pUser.role && pUser.role !== 'user' && <span className="role-badge">{pUser.role}</span>}
            {profile?.category && profile.category.split(',').map((c) => <span key={c} className="role-badge">{c.trim()}</span>)}
            {profile?.industry && <span className="role-badge">{profile.industry}</span>}
            {pUser.location && <span className="location-tag"><MapPin size={13} /> {pUser.location}</span>}
          </div>
          {rating && (
            <div className="profile-rating">
              <Star size={15} fill="var(--accent)" stroke="var(--accent)" />
              <span>{rating}</span>
              <span className="muted">({reviewCount} review{reviewCount !== 1 ? 's' : ''})</span>
            </div>
          )}
          {pUser.biography && <p className="profile-bio">{pUser.biography}</p>}
          <span className="profile-joined"><Calendar size={13} /> Joined {new Date(pUser.createdAt).toLocaleDateString()}</span>
        </div>

        {/* Actions */}
        <div className="profile-actions">
          {isOwn && (
            <button className="btn-secondary" onClick={() => navigate('/onboarding')}>
              <Edit3 size={14} /> Edit Profile
            </button>
          )}
          {!isOwn && !collabSent && (
            <button className="btn-primary" onClick={() => setShowCollabForm(true)}>
              <Send size={14} /> Collaborate
            </button>
          )}
          {collabSent && <span className="muted">Request sent</span>}
        </div>
      </div>

      <div className="profile-page-grid">
        {/* Left column */}
        <div className="profile-left">
          {/* Multi-platform stats */}
          {isInfluencer && profile && (
            <div className="card">
              <h3><BarChart3 size={16} /> Platform Stats</h3>
              <div className="platform-cards">
                {profile.instagramFollowers > 0 && (
                  <div className="plat-card instagram">
                    <Instagram size={18} />
                    <div>
                      <span className="plat-num">{formatNum(profile.instagramFollowers)}</span>
                      <span className="plat-label">followers</span>
                    </div>
                    {profile.instagramEngagement > 0 && (
                      <span className="plat-engagement">{profile.instagramEngagement}% eng.</span>
                    )}
                  </div>
                )}
                {profile.tiktokFollowers > 0 && (
                  <div className="plat-card tiktok">
                    <Hash size={18} />
                    <div>
                      <span className="plat-num">{formatNum(profile.tiktokFollowers)}</span>
                      <span className="plat-label">followers</span>
                    </div>
                    {profile.tiktokAvgViews > 0 && (
                      <span className="plat-engagement">{formatNum(profile.tiktokAvgViews)} avg views</span>
                    )}
                  </div>
                )}
                {profile.youtubeSubscribers > 0 && (
                  <div className="plat-card youtube">
                    <Youtube size={18} />
                    <div>
                      <span className="plat-num">{formatNum(profile.youtubeSubscribers)}</span>
                      <span className="plat-label">subscribers</span>
                    </div>
                    {profile.youtubeAvgViews > 0 && (
                      <span className="plat-engagement">{formatNum(profile.youtubeAvgViews)} avg views</span>
                    )}
                  </div>
                )}
              </div>
              {profile.audienceAgeRange && (
                <div className="detail-row">
                  <span className="detail-label">Audience Age</span>
                  <span className="detail-value">{profile.audienceAgeRange}</span>
                </div>
              )}
              {profile.audienceLocation && (
                <div className="detail-row">
                  <span className="detail-label">Audience Location</span>
                  <span className="detail-value">{profile.audienceLocation}</span>
                </div>
              )}
              {(profile.minRate > 0 || profile.maxRate > 0) && (
                <div className="detail-row">
                  <span className="detail-label">Rate Range</span>
                  <span className="detail-value">NPR {formatNum(profile.minRate)} - {formatNum(profile.maxRate)}</span>
                </div>
              )}
            </div>
          )}

          {/* Brand details */}
          {isBrand && profile && (
            <div className="card">
              <h3><Briefcase size={16} /> Brand Details</h3>
              {profile.companyName && (
                <div className="detail-row"><span className="detail-label">Company</span><span className="detail-value">{profile.companyName}</span></div>
              )}
              {profile.productType && (
                <div className="detail-row"><span className="detail-label">Product/Service</span><span className="detail-value">{profile.productType}</span></div>
              )}
              {profile.website && (
                <div className="detail-row"><span className="detail-label">Website</span><span className="detail-value"><a href={profile.website} target="_blank" rel="noreferrer">{profile.website}</a></span></div>
              )}
              {profile.targetAudience && (
                <div className="detail-row"><span className="detail-label">Target Audience</span><span className="detail-value">{profile.targetAudience}</span></div>
              )}
              {profile.campaignGoals && (
                <div className="detail-row"><span className="detail-label">Campaign Goals</span><span className="detail-value">{profile.campaignGoals}</span></div>
              )}
              {(profile.minBudget > 0 || profile.maxBudget > 0) && (
                <div className="detail-row"><span className="detail-label">Budget Range</span><span className="detail-value">NPR {formatNum(profile.minBudget)} - {formatNum(profile.maxBudget)}</span></div>
              )}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="profile-right">
          {/* Campaigns / portfolio */}
          <div className="card">
            <h3>
              <Megaphone size={16} /> Portfolio / Campaigns
              {isOwn && (
                <button className="btn-icon-sm" onClick={() => setShowAddCampaign(!showAddCampaign)} style={{ marginLeft: 'auto' }}>
                  <Plus size={16} />
                </button>
              )}
            </h3>

            {showAddCampaign && (
              <form onSubmit={handleAddCampaign} className="inline-form">
                <div className="form-grid">
                  <label className="field">
                    <span className="field-label">Title</span>
                    <input value={campaignForm.title} onChange={(e) => setCampaignForm((p) => ({ ...p, title: e.target.value }))} required placeholder="Campaign name" />
                  </label>
                  <label className="field">
                    <span className="field-label">Platform</span>
                    <input value={campaignForm.platform} onChange={(e) => setCampaignForm((p) => ({ ...p, platform: e.target.value }))} placeholder="Instagram, TikTok..." />
                  </label>
                </div>
                <label className="field">
                  <span className="field-label">Description</span>
                  <textarea value={campaignForm.description} onChange={(e) => setCampaignForm((p) => ({ ...p, description: e.target.value }))} rows={2} placeholder="What was this campaign about?" />
                </label>
                <div className="form-grid">
                  <label className="field">
                    <span className="field-label">Reach</span>
                    <input type="number" value={campaignForm.reach} onChange={(e) => setCampaignForm((p) => ({ ...p, reach: e.target.value }))} placeholder="0" />
                  </label>
                  <label className="field">
                    <span className="field-label">Engagement</span>
                    <input type="number" value={campaignForm.engagement} onChange={(e) => setCampaignForm((p) => ({ ...p, engagement: e.target.value }))} placeholder="0" />
                  </label>
                </div>
                <label className="field">
                  <span className="field-label">Results Summary</span>
                  <input value={campaignForm.resultsSummary} onChange={(e) => setCampaignForm((p) => ({ ...p, resultsSummary: e.target.value }))} placeholder="e.g. 2x sales increase" />
                </label>
                <button type="submit" className="btn-primary" style={{ marginTop: 8 }}>Add Campaign</button>
              </form>
            )}

            {(isOwn ? campaigns : profileData.campaigns || []).length === 0 && (
              <p className="muted">No campaigns yet.</p>
            )}

            <div className="campaign-list">
              {(isOwn ? campaigns : profileData.campaigns || []).map((c) => (
                <div key={c.id} className="campaign-card">
                  <div className="campaign-header">
                    <h4>{c.title}</h4>
                    {isOwn && (
                      <button className="btn-icon-sm danger" onClick={() => handleDeleteCampaign(c.id)}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  {c.platform && <span className="role-badge">{c.platform}</span>}
                  {c.description && <p>{c.description}</p>}
                  <div className="campaign-stats">
                    {c.reach > 0 && <span><Eye size={13} /> {formatNum(c.reach)} reach</span>}
                    {c.engagement > 0 && <span><Heart size={13} /> {formatNum(c.engagement)} engagement</span>}
                  </div>
                  {c.results_summary && <p className="results-text">{c.results_summary}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Reviews */}
          <div className="card">
            <h3><Star size={16} /> Reviews {reviews.avgRating && `(${reviews.avgRating} avg)`}</h3>
            {reviews.reviews.length === 0 && <p className="muted">No reviews yet.</p>}
            {reviews.reviews.map((r) => (
              <div key={r.id} className="review-card">
                <div className="review-header">
                  <div className="review-avatar" style={{ background: r.reviewer_color || 'var(--accent)' }}>
                    {(r.reviewer_name || '?')[0]}
                  </div>
                  <div>
                    <span className="review-name">{r.reviewer_name}</span>
                    <div className="review-stars">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={12} fill={s <= r.rating ? 'var(--accent)' : 'none'} stroke={s <= r.rating ? 'var(--accent)' : 'var(--border)'} />
                      ))}
                    </div>
                  </div>
                  <span className="review-date">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                {r.comment && <p className="review-comment">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Collab request modal */}
      {showCollabForm && (
        <div className="modal-overlay" onClick={() => setShowCollabForm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Send Collaboration Request</h3>
            <p className="muted">to {pUser.displayName}</p>
            <form onSubmit={handleSendCollab}>
              <label className="field">
                <span className="field-label">Campaign Title</span>
                <input value={collabForm.campaignTitle} onChange={(e) => setCollabForm((p) => ({ ...p, campaignTitle: e.target.value }))} placeholder="What's the campaign about?" />
              </label>
              <label className="field">
                <span className="field-label">Message</span>
                <textarea value={collabForm.message} onChange={(e) => setCollabForm((p) => ({ ...p, message: e.target.value }))} rows={3} placeholder="Introduce yourself and explain why you'd like to collaborate..." />
              </label>
              <label className="field">
                <span className="field-label">Budget Offered (NPR)</span>
                <input type="number" value={collabForm.budgetOffered} onChange={(e) => setCollabForm((p) => ({ ...p, budgetOffered: e.target.value }))} placeholder="0" />
              </label>
              <label className="field">
                <span className="field-label">Collaboration Tenure</span>
                <select value={collabForm.tenureType} onChange={(e) => setCollabForm((p) => ({ ...p, tenureType: e.target.value }))}>
                  <option value="fixed">Fixed Term</option>
                  <option value="lifertime">Lifertime</option>
                </select>
              </label>
              {collabForm.tenureType === 'fixed' && (
                <div className="form-grid">
                  <label className="field">
                    <span className="field-label">How many</span>
                    <input
                      type="number"
                      min="1"
                      value={collabForm.tenureValue}
                      onChange={(e) => setCollabForm((p) => ({ ...p, tenureValue: e.target.value }))}
                      placeholder="20"
                      required
                    />
                  </label>
                  <label className="field">
                    <span className="field-label">Unit</span>
                    <select value={collabForm.tenureUnit} onChange={(e) => setCollabForm((p) => ({ ...p, tenureUnit: e.target.value }))}>
                      <option value="days">Days</option>
                      <option value="months">Months</option>
                      <option value="years">Years</option>
                    </select>
                  </label>
                </div>
              )}
              {collabError && (
                <p style={{ color: 'var(--error, #ef4444)', fontSize: '0.85rem', marginBottom: 8 }}>{collabError}</p>
              )}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCollabForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary"><Send size={14} /> Send Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
