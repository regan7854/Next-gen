import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTrending } from '../services/apiClient.js';
import { TrendingUp, Crown, Star, Users, Briefcase, DollarSign, Award } from 'lucide-react';

export default function TrendingPage() {
  const [topInfluencers, setTopInfluencers] = useState([]);
  const [topBrands, setTopBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const data = await getTrending();
        setTopInfluencers(data.topInfluencers || []);
        setTopBrands(data.topBrands || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load trending data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getRankBadge = (rank) => {
    if (rank === 1) return <span className="rank-badge gold"><Crown size={14} /> #1</span>;
    if (rank === 2) return <span className="rank-badge silver"><Award size={14} /> #2</span>;
    if (rank === 3) return <span className="rank-badge bronze"><Award size={14} /> #3</span>;
    return <span className="rank-badge default">#{rank}</span>;
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (loading) {
    return (
      <div className="trending-page">
        <div className="trending-loading">
          <TrendingUp size={48} className="spin" />
          <p>Loading trending data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trending-page">
        <div className="trending-error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="trending-page">
      <div className="trending-header">
        <TrendingUp size={28} />
        <h1>Trending Now</h1>
        <p className="trending-subtitle">Discover the hottest brands and influencers on the platform</p>
      </div>

      <div className="trending-grid">
        {/* Top 10 Influencers */}
        <div className="trending-list-card">
          <div className="trending-list-header influencer-header">
            <Users size={22} />
            <h2>Top 10 Influencers</h2>
          </div>

          {topInfluencers.length === 0 ? (
            <div className="trending-empty">
              <Users size={40} />
              <p>No influencers ranked yet</p>
              <span>Complete your profile and start collaborating!</span>
            </div>
          ) : (
            <div className="trending-list">
              {topInfluencers.map((inf, idx) => (
                <div
                  key={inf.user_id}
                  className={`trending-item ${idx < 3 ? 'top-three' : ''}`}
                  onClick={() => navigate(`/profile/${inf.user_id}`)}
                >
                  <div className="trending-rank">{getRankBadge(idx + 1)}</div>
                  <div className="trending-avatar">
                    {inf.display_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="trending-info">
                    <h3>{inf.display_name || 'Unknown'}</h3>
                    <div className="trending-tags">
                      {inf.niche && <span className="trending-tag">{inf.niche}</span>}
                      {inf.primary_platform && <span className="trending-tag platform">{inf.primary_platform}</span>}
                    </div>
                  </div>
                  <div className="trending-stats">
                    <div className="trending-stat">
                      <Users size={12} />
                      <span>{formatNumber(inf.total_followers)}</span>
                    </div>
                    <div className="trending-stat">
                      <Star size={12} />
                      <span>{inf.avg_rating ? Number(inf.avg_rating).toFixed(1) : '—'}</span>
                    </div>
                    <div className="trending-stat">
                      <Briefcase size={12} />
                      <span>{inf.completed_collabs || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top 10 Brands */}
        <div className="trending-list-card">
          <div className="trending-list-header brand-header">
            <Briefcase size={22} />
            <h2>Top 10 Brands</h2>
          </div>

          {topBrands.length === 0 ? (
            <div className="trending-empty">
              <Briefcase size={40} />
              <p>No brands ranked yet</p>
              <span>Register as a brand and start your campaigns!</span>
            </div>
          ) : (
            <div className="trending-list">
              {topBrands.map((brand, idx) => (
                <div
                  key={brand.user_id}
                  className={`trending-item ${idx < 3 ? 'top-three' : ''}`}
                  onClick={() => navigate(`/profile/${brand.user_id}`)}
                >
                  <div className="trending-rank">{getRankBadge(idx + 1)}</div>
                  <div className="trending-avatar brand-avatar">
                    {brand.company_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="trending-info">
                    <h3>{brand.company_name || 'Unknown'}</h3>
                    <div className="trending-tags">
                      {brand.industry && <span className="trending-tag">{brand.industry}</span>}
                    </div>
                  </div>
                  <div className="trending-stats">
                    <div className="trending-stat">
                      <DollarSign size={12} />
                      <span>{formatNumber(brand.max_budget)}</span>
                    </div>
                    <div className="trending-stat">
                      <Star size={12} />
                      <span>{brand.avg_rating ? Number(brand.avg_rating).toFixed(1) : '—'}</span>
                    </div>
                    <div className="trending-stat">
                      <Briefcase size={12} />
                      <span>{brand.completed_collabs || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
