import { useEffect, useState } from 'react';
import { fetchProfile } from '../services/apiClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Link, useNavigate } from 'react-router-dom';
import {
  Handshake, Mail, Users, Star, Search, MessageSquare, UserCircle,
  Zap, Clock, ArrowRight, Sparkles, Bell, TrendingUp, Globe,
} from 'lucide-react';
import { getMyCollabRequests, getNotifications as fetchNotifs, getRecommendations } from '../services/apiClient.js';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(!user);
  const [stats, setStats] = useState({ collabs: 0, messages: 0, connections: 0, reviews: 0 });
  const [recommendations, setRecommendations] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!profile) {
          const { user: u } = await fetchProfile();
          if (mounted) { setProfile(u); setLoading(false); }
        }
        // load stats
        const [collabData, notifData] = await Promise.all([
          getMyCollabRequests().catch(() => ({ sent: [], received: [] })),
          fetchNotifs().catch(() => ({ notifications: [] })),
        ]);
        if (mounted) {
          const acceptedCount = [...collabData.sent, ...collabData.received]
            .filter((r) => r.status === 'accepted').length;
          setStats({
            collabs: acceptedCount,
            messages: collabData.received.filter((r) => r.status === 'pending').length,
            connections: [...collabData.sent, ...collabData.received].length,
            reviews: 0,
          });
          setNotifications(notifData.notifications?.slice(0, 5) || []);
        }
        // load recommendations
        const recData = await getRecommendations().catch(() => ({ results: [] }));
        if (mounted) setRecommendations(recData.results?.slice(0, 3) || []);
      } catch {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const initial = profile?.displayName?.[0]?.toUpperCase() || '?';
  const greeting = profile?.displayName ? `Welcome back, ${profile.displayName}` : 'Welcome back';
  const needsOnboarding = profile && (profile.role === 'user' || !profile.role);

  return (
    <div className="page-container dashboard">
      {/* Onboarding nudge */}
      {needsOnboarding && (
        <div className="onboarding-banner" onClick={() => navigate('/onboarding')}>
          <Sparkles size={20} />
          <div>
            <strong>Complete your profile</strong>
            <p>Set up your influencer or brand profile to unlock collaborations and matches.</p>
          </div>
          <ArrowRight size={18} />
        </div>
      )}

      {/* Hero */}
      <div className="dash-hero">
        <div className="dash-hero-text">
          <p className="dash-hero-greeting">Good to see you again</p>
          <h1>{greeting} <span className="wave">👋</span></h1>
          <p className="dash-hero-sub">Here&apos;s an overview of your NextGen Collaborate activity and insights.</p>
        </div>
        {profile && <div className="dash-hero-avatar">{initial}</div>}
      </div>

      {loading && <div className="card"><p className="muted">Loading your data...</p></div>}

      {profile && (
        <>
          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card stat-collabs clickable" onClick={() => navigate('/collaborations?filter=accepted')}>
              <span className="stat-icon"><Handshake size={22} /></span>
              <div>
                <span className="stat-number">{stats.collabs}</span>
                <span className="stat-label">Collaborations</span>
              </div>
            </div>
            <div className="stat-card stat-pending clickable" onClick={() => navigate('/collaborations?filter=pending')}>
              <span className="stat-icon"><Mail size={22} /></span>
              <div>
                <span className="stat-number">{stats.messages}</span>
                <span className="stat-label">Pending Requests</span>
              </div>
            </div>
            <div className="stat-card stat-connections clickable" onClick={() => navigate('/collaborations')}>
              <span className="stat-icon"><Users size={22} /></span>
              <div>
                <span className="stat-number">{stats.connections}</span>
                <span className="stat-label">Connections</span>
              </div>
            </div>
            <div className="stat-card stat-reviews clickable" onClick={() => navigate('/profile')}>
              <span className="stat-icon"><Star size={22} /></span>
              <div>
                <span className="stat-number">{stats.reviews}</span>
                <span className="stat-label">Reviews</span>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="card quick-actions-card">
            <h3><Zap size={18} /> Quick Actions</h3>
            <div className="actions-grid">
              <Link to="/discover" className="action-card action-discover">
                <span className="action-icon"><Search size={20} /></span>
                <span className="action-title">Find Partners</span>
                <span className="action-desc">Browse influencers &amp; brands</span>
              </Link>
              <Link to="/collaborations" className="action-card action-requests">
                <span className="action-icon"><MessageSquare size={20} /></span>
                <span className="action-title">View Requests</span>
                <span className="action-desc">Manage your collaborations</span>
              </Link>
              <Link to="/profile" className="action-card action-profile">
                <span className="action-icon"><UserCircle size={20} /></span>
                <span className="action-title">My Profile</span>
                <span className="action-desc">Edit your public profile</span>
              </Link>
              <Link to="/trending" className="action-card action-trending">
                <span className="action-icon"><TrendingUp size={20} /></span>
                <span className="action-title">Trending</span>
                <span className="action-desc">See who&apos;s rising fast</span>
              </Link>
            </div>
          </div>

          {/* Top Matches preview */}
          {recommendations.length > 0 && (
            <div className="card">
              <h3><Sparkles size={18} /> Top Matches</h3>
              <div className="match-preview-list">
                {recommendations.map((r) => (
                  <div key={r.id} className="match-preview-item" onClick={() => navigate(`/profile/${r.id}`)}>
                    <div className="match-avatar" style={{ background: r.avatarColor || 'var(--accent)' }}>
                      {(r.displayName || r.companyName || '?')[0]}
                    </div>
                    <div className="match-info">
                      <span className="match-name">{r.displayName || r.companyName}</span>
                      <span className="match-detail">{r.category || r.industry || ''}</span>
                    </div>
                    <span className="match-score">{r.matchScore}%</span>
                  </div>
                ))}
              </div>
              <Link to="/discover" className="view-all-link">View all matches <ArrowRight size={14} /></Link>
            </div>
          )}

          {/* Notifications */}
          {notifications.length > 0 && (
            <div className="card">
              <h3><Bell size={18} /> Recent Notifications</h3>
              <div className="activity-list">
                {notifications.map((n) => (
                  <div key={n.id} className="activity-item">
                    <div className="activity-dot"></div>
                    <div>
                      <p className="activity-text">{n.body || n.title}</p>
                      <span className="activity-time">{new Date(n.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent activity */}
          <div className="card">
            <h3><Clock size={18} /> Recent Activity</h3>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-dot"></div>
                <div>
                  <p className="activity-text">You joined NextGen Collaborate</p>
                  <span className="activity-time">Just now</span>
                </div>
              </div>
            </div>
          </div>

          {/* Platform info banner */}
          <div className="platform-banner">
            <Globe size={20} />
            <div>
              <strong>NextGen Collaborate</strong>
              <p>Connect with influencers and brands. Build meaningful partnerships that grow your audience and business.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
