import { useState, useEffect } from 'react';
import { getTrending } from '../services/apiClient.js';
import { TrendingUp, Users, Star, Instagram, Youtube } from 'lucide-react';

function formatNumber(n) {
  if (!n) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n;
}

function RankBadge({ rank }) {
  const cls = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : 'default';
  return <span className={`rank-badge ${cls}`}>#{rank}</span>;
}

function Avatar({ name, color, size = 44 }) {
  return (
    <div
      className="trending-avatar"
      style={{ width: size, height: size, background: color || '#C8552A', fontSize: size * 0.38 }}
    >
      {(name || '?')[0].toUpperCase()}
    </div>
  );
}

export default function TrendingPage() {
  const [data, setData] = useState({ influencers: [], brands: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getTrending()
      .then(setData)
      .catch(() => setError('Could not load trending data.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="trending-page">
      <div className="trending-header">
        <h1>
          <TrendingUp size={28} />
          What's Trending
        </h1>
        <p className="trending-subtitle">
          Top creators and brands ranked by activity, reach, and collaborations
        </p>
      </div>

      {loading && <div className="trending-empty"><p>Loading...</p></div>}
      {error && <div className="trending-empty"><p>{error}</p></div>}

      {!loading && !error && (
        <div className="trending-grid">

          {/* Top Influencers */}
          <div className="trending-list-card">
            <div className="trending-list-header influencer-header">
              <Users size={18} />
              Top Influencers
            </div>
            <div className="trending-list">
              {data.influencers.length === 0 && (
                <div className="trending-empty" style={{ padding: '2rem' }}>
                  <p>No influencers yet.</p>
                </div>
              )}
              {data.influencers.map((inf) => {
                const topFollowers = Math.max(
                  inf.platforms?.instagram?.followers || 0,
                  inf.platforms?.tiktok?.followers || 0,
                  inf.platforms?.youtube?.subscribers || 0
                );
                return (
                  <div key={inf.id} className={`trending-item${inf.rank <= 3 ? ' top-three' : ''}`}>
                    <div className="trending-rank"><RankBadge rank={inf.rank} /></div>
                    <Avatar name={inf.displayName} color={inf.avatarColor} />
                    <div className="trending-info">
                      <h3>{inf.displayName}</h3>
                      <div className="trending-tags">
                        {inf.category && inf.category.split(',').map((c) => <span key={c} className="trending-tag">{c.trim()}</span>)}
                        {inf.niche && <span className="trending-tag">{inf.niche}</span>}
                        {inf.platforms?.instagram?.handle && (
                          <span className="trending-tag platform">
                            <Instagram size={10} style={{ display: 'inline', marginRight: 2 }} />
                            IG
                          </span>
                        )}
                        {inf.platforms?.youtube?.handle && (
                          <span className="trending-tag platform">
                            <Youtube size={10} style={{ display: 'inline', marginRight: 2 }} />
                            YT
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="trending-stats">
                      <div className="trending-stat">
                        <Users size={13} />
                        {formatNumber(topFollowers)}
                      </div>
                      {inf.avgRating > 0 && (
                        <div className="trending-stat">
                          <Star size={13} />
                          {inf.avgRating}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Brands */}
          <div className="trending-list-card">
            <div className="trending-list-header brand-header">
              <TrendingUp size={18} />
              Top Brands
            </div>
            <div className="trending-list">
              {data.brands.length === 0 && (
                <div className="trending-empty" style={{ padding: '2rem' }}>
                  <p>No brands yet.</p>
                </div>
              )}
              {data.brands.map((brand) => (
                <div key={brand.id} className={`trending-item${brand.rank <= 3 ? ' top-three' : ''}`}>
                  <div className="trending-rank"><RankBadge rank={brand.rank} /></div>
                  <Avatar name={brand.companyName || brand.displayName} color={brand.avatarColor} size={44} />
                  <div className="trending-info">
                    <h3>{brand.companyName || brand.displayName}</h3>
                    <div className="trending-tags">
                      {brand.industry && <span className="trending-tag">{brand.industry}</span>}
                      {brand.productType && <span className="trending-tag">{brand.productType}</span>}
                    </div>
                  </div>
                  <div className="trending-stats">
                    {brand.maxBudget > 0 && (
                      <div className="trending-stat">
                        <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>
                          up to ${formatNumber(brand.maxBudget)}
                        </span>
                      </div>
                    )}
                    {brand.avgRating > 0 && (
                      <div className="trending-stat">
                        <Star size={13} />
                        {brand.avgRating}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
