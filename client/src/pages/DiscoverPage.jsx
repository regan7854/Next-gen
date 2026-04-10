import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import {
  searchInfluencers, searchBrands, getRecommendations, getFilterOptions,
} from '../services/apiClient.js';
import {
  Search, SlidersHorizontal, Star, MapPin, Instagram, Youtube, Hash,
  Sparkles, Users, Building2, ChevronDown, X,
} from 'lucide-react';

function formatNum(n) {
  if (!n) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

export default function DiscoverPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isBrand = user?.role === 'brand';
  const [tab, setTab] = useState(isBrand ? 'influencers' : 'brands');
  const [results, setResults] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ category: '', platform: '', minFollowers: '', industry: '', minBudget: '' });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getFilterOptions().then((d) => {
      setCategories(d.categories || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => performSearch(), 300);
    return () => clearTimeout(timer);
  }, [tab, query, filters]);

  useEffect(() => {
    getRecommendations()
      .then((d) => setRecommendations(d.results || []))
      .catch(() => {});
  }, []);

  const performSearch = async () => {
    setLoading(true);
    try {
      if (tab === 'influencers') {
        const data = await searchInfluencers({
          q: query || undefined,
          category: filters.category || undefined,
          platform: filters.platform || undefined,
          minFollowers: filters.minFollowers || undefined,
        });
        setResults(data.results || []);
      } else {
        const data = await searchBrands({
          q: query || undefined,
          industry: filters.industry || undefined,
          minBudget: filters.minBudget || undefined,
        });
        setResults(data.results || []);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Discover</h1>
        <p>Find the right {tab === 'influencers' ? 'influencers' : 'brands'} to collaborate with</p>
      </div>

      {/* Tabs */}
      <div className="discover-tabs">
        <button className={`dtab ${tab === 'influencers' ? 'active' : ''}`} onClick={() => setTab('influencers')}>
          <Users size={16} /> Influencers
        </button>
        <button className={`dtab ${tab === 'brands' ? 'active' : ''}`} onClick={() => setTab('brands')}>
          <Building2 size={16} /> Brands
        </button>
        {recommendations.length > 0 && (
          <button className={`dtab ${tab === 'recommended' ? 'active' : ''}`} onClick={() => setTab('recommended')}>
            <Sparkles size={16} /> For You
          </button>
        )}
      </div>

      {/* Search & filters */}
      <div className="discover-controls">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder={tab === 'influencers' ? 'Search influencers...' : 'Search brands...'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && <button className="clear-btn" onClick={() => setQuery('')}><X size={14} /></button>}
        </div>
        <button className="filter-toggle-btn" onClick={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal size={16} /> Filters <ChevronDown size={14} />
        </button>
      </div>

      {showFilters && (
        <div className="filter-panel">
          {tab === 'influencers' ? (
            <>
              <label className="field">
                <span className="field-label">Category</span>
                <select value={filters.category} onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}>
                  <option value="">All categories</option>
                  {categories.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </label>
              <label className="field">
                <span className="field-label">Platform</span>
                <select value={filters.platform} onChange={(e) => setFilters((p) => ({ ...p, platform: e.target.value }))}>
                  <option value="">Any platform</option>
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="youtube">YouTube</option>
                </select>
              </label>
              <label className="field">
                <span className="field-label">Min Followers</span>
                <input type="number" value={filters.minFollowers} onChange={(e) => setFilters((p) => ({ ...p, minFollowers: e.target.value }))} placeholder="0" />
              </label>
            </>
          ) : (
            <>
              <label className="field">
                <span className="field-label">Industry</span>
                <input value={filters.industry} onChange={(e) => setFilters((p) => ({ ...p, industry: e.target.value }))} placeholder="e.g. fashion" />
              </label>
              <label className="field">
                <span className="field-label">Min Budget</span>
                <input type="number" value={filters.minBudget} onChange={(e) => setFilters((p) => ({ ...p, minBudget: e.target.value }))} placeholder="0" />
              </label>
            </>
          )}
        </div>
      )}

      {/* Recommended tab */}
      {tab === 'recommended' && (
        <div className="discover-grid">
          {recommendations.map((r) => (
            <div key={r.id} className="creator-card" onClick={() => navigate(`/profile/${r.id}`)}>
              <div className="card-top-row">
                <div className="creator-avatar" style={{ background: r.avatarColor || 'var(--accent)' }}>
                  {(r.displayName || r.companyName || '?')[0]}
                </div>
                <span className="match-badge">{r.matchScore}% match</span>
              </div>
              <div className="creator-info">
                <h3>{r.displayName || r.companyName}</h3>
                {r.category && r.category.split(',').map((c) => <span key={c} className="role-badge">{c.trim()}</span>)}
                {r.industry && <span className="role-badge">{r.industry}</span>}
                <p>{r.biography || ''}</p>
              </div>
              <button type="button" className="btn-connect" onClick={(e) => { e.stopPropagation(); navigate(`/profile/${r.id}`); }}>
                View Profile
              </button>
            </div>
          ))}
          {recommendations.length === 0 && <div className="empty-state"><p>Complete your profile to get personalized recommendations.</p></div>}
        </div>
      )}

      {/* Results */}
      {tab !== 'recommended' && (
        <div className="discover-grid">
          {loading && <div className="empty-state"><p>Searching...</p></div>}
          {!loading && results.length === 0 && <div className="empty-state"><p>No results found. Try different filters or complete your profile to see matches.</p></div>}
          {!loading && results.map((r) => (
            <div key={r.id} className="creator-card" onClick={() => navigate(`/profile/${r.id}`)}>
              <div className="card-top-row">
                <div className="creator-avatar" style={{ background: r.avatarColor || 'var(--accent)' }}>
                  {(r.displayName || r.companyName || '?')[0]}
                </div>
                {r.avgRating && (
                  <span className="rating-small"><Star size={12} /> {r.avgRating}</span>
                )}
              </div>
              <div className="creator-info">
                <h3>{r.displayName || r.companyName}</h3>
                {r.category && r.category.split(',').map((c) => <span key={c} className="role-badge">{c.trim()}</span>)}
                {r.industry && <span className="role-badge">{r.industry}</span>}
                <p>{r.biography || ''}</p>

                {/* Multi-platform stats for influencers */}
                {r.platforms && (
                  <div className="platform-stats">
                    {r.platforms.instagram?.followers > 0 && (
                      <span className="plat-stat"><Instagram size={13} /> {formatNum(r.platforms.instagram.followers)}</span>
                    )}
                    {r.platforms.tiktok?.followers > 0 && (
                      <span className="plat-stat"><Hash size={13} /> {formatNum(r.platforms.tiktok.followers)}</span>
                    )}
                    {r.platforms.youtube?.subscribers > 0 && (
                      <span className="plat-stat"><Youtube size={13} /> {formatNum(r.platforms.youtube.subscribers)}</span>
                    )}
                  </div>
                )}

                {/* Brand info */}
                {r.maxBudget > 0 && (
                  <span className="budget-range">Budget: NPR {formatNum(r.minBudget)} - {formatNum(r.maxBudget)}</span>
                )}

                {r.location && (
                  <span className="location-tag"><MapPin size={12} /> {r.location}</span>
                )}
              </div>
              <button type="button" className="btn-connect" onClick={(e) => { e.stopPropagation(); navigate(`/profile/${r.id}`); }}>
                View Profile
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
