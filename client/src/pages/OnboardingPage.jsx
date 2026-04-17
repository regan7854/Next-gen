import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { saveInfluencerProfile, saveBrandProfile, getPublicProfile } from '../services/apiClient.js';
import {
  User, Building2, ArrowRight, ArrowLeft, MapPin,
  Instagram, Youtube, Hash, DollarSign, Tag, Globe, Target, Megaphone,
} from 'lucide-react';

const CATEGORIES = [
  'beauty', 'fitness', 'gaming', 'travel', 'food', 'fashion',
  'technology', 'education', 'lifestyle', 'health', 'entertainment', 'music', 'sports', 'business',
];

const INDUSTRIES = [
  'fashion', 'food & beverage', 'technology', 'health & wellness', 'beauty',
  'travel & tourism', 'education', 'finance', 'entertainment', 'sports', 'e-commerce', 'real estate',
];

const PRODUCT_TYPES = [
  'Clothing', 'Fashion Accessories', 'Food & Beverage', 'Technology', 'SaaS',
  'Health & Wellness', 'Beauty & Cosmetics', 'Finance', 'Education', 'Entertainment',
  'Sports & Fitness', 'Travel', 'Lifestyle', 'Services', 'E-commerce', 'Real Estate',
];

const TARGET_AUDIENCES = [
  '13–17', '18–24', '25–34', '35–44', '45+', 'All Ages',
];

const PLATFORMS = ['Instagram', 'TikTok', 'YouTube'];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [step, setStep] = useState(1); // 1: role, 2: details
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

  const toggleDropdown = useCallback((name) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Influencer fields
  const [inf, setInf] = useState({
    category: [], niche: '', location: '', biography: '',
    instagramHandle: '', instagramFollowers: '', instagramEngagement: '',
    tiktokHandle: '', tiktokFollowers: '', tiktokAvgViews: '',
    youtubeHandle: '', youtubeSubscribers: '', youtubeAvgViews: '',
    audienceAgeRange: '', audienceLocation: '',
    minRate: '', maxRate: '',
  });

  // Brand fields
  const [brand, setBrand] = useState({
    companyName: '', industry: [], website: '', productType: [],
    targetAudience: [], campaignGoals: '', location: '', biography: '',
    minBudget: '', maxBudget: '',
    preferredPlatforms: [], preferredCategories: [],
  });

  // Prefill existing profile data when editing
  useEffect(() => {
    if (!user?.id || !user?.role || user.role === 'user') return;

    getPublicProfile(user.id).then((data) => {
      const existingRole = data.user?.role;
      const p = data.profile;
      if (!existingRole || !p) return;

      setRole(existingRole);
      setStep(2);

      if (existingRole === 'influencer') {
        setInf({
          category: p.category ? p.category.split(',').map((c) => c.trim()) : [],
          niche: p.niche || '',
          location: data.user.location || '',
          biography: data.user.biography || '',
          instagramHandle: p.instagramHandle || '',
          instagramFollowers: p.instagramFollowers || '',
          instagramEngagement: p.instagramEngagement || '',
          tiktokHandle: p.tiktokHandle || '',
          tiktokFollowers: p.tiktokFollowers || '',
          tiktokAvgViews: p.tiktokAvgViews || '',
          youtubeHandle: p.youtubeHandle || '',
          youtubeSubscribers: p.youtubeSubscribers || '',
          youtubeAvgViews: p.youtubeAvgViews || '',
          audienceAgeRange: p.audienceAgeRange || '',
          audienceLocation: p.audienceLocation || '',
          minRate: p.minRate || '',
          maxRate: p.maxRate || '',
        });
      } else if (existingRole === 'brand') {
        setBrand({
          companyName: p.companyName || '',
          industry: p.industry ? p.industry.split(',').map((i) => i.trim()) : [],
          website: p.website || '',
          productType: p.productType ? p.productType.split(',').map((v) => v.trim()) : [],
          targetAudience: p.targetAudience ? p.targetAudience.split(',').map((v) => v.trim()) : [],
          campaignGoals: p.campaignGoals || '',
          location: data.user.location || '',
          biography: data.user.biography || '',
          minBudget: p.minBudget || '',
          maxBudget: p.maxBudget || '',
          preferredPlatforms: p.preferredPlatforms ? p.preferredPlatforms.split(',').map((v) => v.trim()) : [],
          preferredCategories: p.preferredCategories ? p.preferredCategories.split(',').map((c) => c.trim()) : [],
        });
      }
    }).catch(() => { /* first time — no profile yet */ });
  }, [user]);

  const updateInf = (e) => setInf((p) => ({ ...p, [e.target.name]: e.target.value }));
  const toggleCategory = (cat) => {
    setInf((p) => ({
      ...p,
      category: p.category.includes(cat)
        ? p.category.filter((c) => c !== cat)
        : [...p.category, cat],
    }));
  };
  const updateBrand = (e) => setBrand((p) => ({ ...p, [e.target.name]: e.target.value }));
  const toggleIndustry = (ind) => {
    setBrand((p) => ({
      ...p,
      industry: p.industry.includes(ind)
        ? p.industry.filter((i) => i !== ind)
        : [...p.industry, ind],
    }));
  };
  const togglePrefCategory = (cat) => {
    setBrand((p) => ({
      ...p,
      preferredCategories: p.preferredCategories.includes(cat)
        ? p.preferredCategories.filter((c) => c !== cat)
        : [...p.preferredCategories, cat],
    }));
  };
  const toggleProductType = (val) => {
    setBrand((p) => ({
      ...p,
      productType: p.productType.includes(val)
        ? p.productType.filter((v) => v !== val)
        : [...p.productType, val],
    }));
  };
  const toggleTargetAudience = (val) => {
    setBrand((p) => ({
      ...p,
      targetAudience: p.targetAudience.includes(val)
        ? p.targetAudience.filter((v) => v !== val)
        : [...p.targetAudience, val],
    }));
  };
  const togglePlatform = (val) => {
    setBrand((p) => ({
      ...p,
      preferredPlatforms: p.preferredPlatforms.includes(val)
        ? p.preferredPlatforms.filter((v) => v !== val)
        : [...p.preferredPlatforms, val],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (role === 'influencer') {
        await saveInfluencerProfile({
          ...inf,
          category: inf.category.join(','),
          instagramFollowers: Number(inf.instagramFollowers) || 0,
          instagramEngagement: Number(inf.instagramEngagement) || 0,
          tiktokFollowers: Number(inf.tiktokFollowers) || 0,
          tiktokAvgViews: Number(inf.tiktokAvgViews) || 0,
          youtubeSubscribers: Number(inf.youtubeSubscribers) || 0,
          youtubeAvgViews: Number(inf.youtubeAvgViews) || 0,
          minRate: Number(inf.minRate) || 0,
          maxRate: Number(inf.maxRate) || 0,
        });
      } else {
        await saveBrandProfile({
          ...brand,
          industry: brand.industry.join(','),
          productType: brand.productType.join(','),
          targetAudience: brand.targetAudience.join(','),
          preferredPlatforms: brand.preferredPlatforms.join(','),
          preferredCategories: brand.preferredCategories.join(','),
          minBudget: Number(brand.minBudget) || 0,
          maxBudget: Number(brand.maxBudget) || 0,
        });
      }

      // update local auth state with new role
      const token = JSON.parse(localStorage.getItem('nextgen-auth'))?.token;
      login({ token, user: { ...user, role } });
      navigate('/profile', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <h1>{user?.role && user.role !== 'user' ? 'Edit your profile' : 'Set up your profile'}</h1>
          <p>Tell us about yourself so we can find the best matches for you</p>
          <div className="step-indicator">
            <span className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</span>
            <span className="step-line"></span>
            <span className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</span>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {step === 1 && (
          <div className="role-selection">
            <p className="role-prompt">I am a...</p>
            <div className="role-cards">
              <button
                type="button"
                className={`role-card ${role === 'influencer' ? 'selected' : ''}`}
                onClick={() => setRole('influencer')}
              >
                <User size={28} />
                <h3>Influencer</h3>
                <p>I create content and want to partner with brands</p>
              </button>
              <button
                type="button"
                className={`role-card ${role === 'brand' ? 'selected' : ''}`}
                onClick={() => setRole('brand')}
              >
                <Building2 size={28} />
                <h3>Brand</h3>
                <p>I represent a company looking for influencers</p>
              </button>
            </div>
            <button
              type="button"
              className="btn-primary"
              disabled={!role}
              onClick={() => setStep(2)}
              style={{ marginTop: 16 }}
            >
              Continue <ArrowRight size={16} />
            </button>
          </div>
        )}

        {step === 2 && role === 'influencer' && (
          <form onSubmit={handleSubmit} className="onboarding-form" ref={dropdownRef}>
            <div className="form-section">
              <h3><Tag size={16} /> Basic Info</h3>
              <div className="form-grid">
                <div className="field">
                  <span className="field-label">Content Category</span>
                  <div className="multi-select-wrapper">
                    <button
                      type="button"
                      className="multi-select-trigger"
                      onClick={() => toggleDropdown('category')}
                    >
                      {inf.category.length === 0
                        ? 'Select categories'
                        : inf.category.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(', ')}
                    </button>
                    {openDropdown === 'category' && (
                      <div className="multi-select-options">
                        <div className="multi-select-list">
                          {CATEGORIES.map((c) => (
                            <label key={c} className="multi-select-option">
                              <input
                                type="checkbox"
                                checked={inf.category.includes(c)}
                                onChange={() => toggleCategory(c)}
                              />
                              <span>{c.charAt(0).toUpperCase() + c.slice(1)}</span>
                            </label>
                          ))}
                        </div>
                        <div className="multi-select-footer">
                          <span className="multi-select-count">{inf.category.length} selected</span>
                          <button type="button" className="multi-select-ok" onClick={() => setOpenDropdown(null)}>OK</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <label className="field">
                  <span className="field-label">Niche / Specialty</span>
                  <input name="niche" value={inf.niche} onChange={updateInf} placeholder="e.g. Street photography" />
                </label>
                <label className="field">
                  <span className="field-label">Location</span>
                  <input name="location" value={inf.location} onChange={updateInf} placeholder="City, Country" />
                </label>
              </div>
              <label className="field">
                <span className="field-label">Bio</span>
                <textarea name="biography" value={inf.biography} onChange={updateInf} rows={3} placeholder="Tell brands about yourself..." />
              </label>
            </div>

            <div className="form-section">
              <h3><Instagram size={16} /> Social Media</h3>
              <div className="form-grid">
                <label className="field">
                  <span className="field-label">Instagram Handle</span>
                  <input name="instagramHandle" value={inf.instagramHandle} onChange={updateInf} placeholder="@username" />
                </label>
                <label className="field">
                  <span className="field-label">Instagram Followers</span>
                  <input name="instagramFollowers" type="number" value={inf.instagramFollowers} onChange={updateInf} placeholder="0" />
                </label>
                <label className="field">
                  <span className="field-label">Engagement Rate (%)</span>
                  <input name="instagramEngagement" type="number" step="0.1" value={inf.instagramEngagement} onChange={updateInf} placeholder="0.0" />
                </label>
              </div>
              <div className="form-grid">
                <label className="field">
                  <span className="field-label">TikTok Handle</span>
                  <input name="tiktokHandle" value={inf.tiktokHandle} onChange={updateInf} placeholder="@username" />
                </label>
                <label className="field">
                  <span className="field-label">TikTok Followers</span>
                  <input name="tiktokFollowers" type="number" value={inf.tiktokFollowers} onChange={updateInf} placeholder="0" />
                </label>
                <label className="field">
                  <span className="field-label">Avg. Views</span>
                  <input name="tiktokAvgViews" type="number" value={inf.tiktokAvgViews} onChange={updateInf} placeholder="0" />
                </label>
              </div>
              <div className="form-grid">
                <label className="field">
                  <span className="field-label">YouTube Channel</span>
                  <input name="youtubeHandle" value={inf.youtubeHandle} onChange={updateInf} placeholder="Channel name" />
                </label>
                <label className="field">
                  <span className="field-label">Subscribers</span>
                  <input name="youtubeSubscribers" type="number" value={inf.youtubeSubscribers} onChange={updateInf} placeholder="0" />
                </label>
                <label className="field">
                  <span className="field-label">Avg. Views</span>
                  <input name="youtubeAvgViews" type="number" value={inf.youtubeAvgViews} onChange={updateInf} placeholder="0" />
                </label>
              </div>
            </div>

            <div className="form-section">
              <h3><Target size={16} /> Audience & Rates</h3>
              <div className="form-grid">
                <label className="field">
                  <span className="field-label">Audience Age Range</span>
                  <input name="audienceAgeRange" value={inf.audienceAgeRange} onChange={updateInf} placeholder="e.g. 18-34" />
                </label>
                <label className="field">
                  <span className="field-label">Audience Location</span>
                  <input name="audienceLocation" value={inf.audienceLocation} onChange={updateInf} placeholder="e.g. Nepal, India" />
                </label>
              </div>
              <div className="form-grid">
                <label className="field">
                  <span className="field-label">Min Rate (NPR)</span>
                  <input name="minRate" type="number" value={inf.minRate} onChange={updateInf} placeholder="0" />
                </label>
                <label className="field">
                  <span className="field-label">Max Rate (NPR)</span>
                  <input name="maxRate" type="number" value={inf.maxRate} onChange={updateInf} placeholder="0" />
                </label>
              </div>
            </div>

            <div className="onboarding-actions">
              <button type="button" className="btn-secondary" onClick={() => setStep(1)}>
                <ArrowLeft size={16} /> Back
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : (user?.role && user.role !== 'user' ? 'Save Changes' : 'Complete Setup')}
              </button>
            </div>
          </form>
        )}

        {step === 2 && role === 'brand' && (
          <form onSubmit={handleSubmit} className="onboarding-form" ref={dropdownRef}>
            <div className="form-section">
              <h3><Building2 size={16} /> Company Info</h3>
              <div className="form-grid">
                <label className="field">
                  <span className="field-label">Company Name</span>
                  <input name="companyName" value={brand.companyName} onChange={updateBrand} placeholder="Your company" required />
                </label>
                <div className="field">
                  <span className="field-label">Industry</span>
                  <div className="multi-select-wrapper">
                    <button
                      type="button"
                      className="multi-select-trigger"
                      onClick={() => toggleDropdown('industry')}
                    >
                      {brand.industry.length === 0
                        ? 'Select industries'
                        : brand.industry.map((i) => i.charAt(0).toUpperCase() + i.slice(1)).join(', ')}
                    </button>
                    {openDropdown === 'industry' && (
                      <div className="multi-select-options">
                        <div className="multi-select-list">
                          {INDUSTRIES.map((i) => (
                            <label key={i} className="multi-select-option">
                              <input
                                type="checkbox"
                                checked={brand.industry.includes(i)}
                                onChange={() => toggleIndustry(i)}
                              />
                              <span>{i.charAt(0).toUpperCase() + i.slice(1)}</span>
                            </label>
                          ))}
                        </div>
                        <div className="multi-select-footer">
                          <span className="multi-select-count">{brand.industry.length} selected</span>
                          <button type="button" className="multi-select-ok" onClick={() => setOpenDropdown(null)}>OK</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <label className="field">
                  <span className="field-label">Website</span>
                  <input name="website" value={brand.website} onChange={updateBrand} placeholder="https://..." />
                </label>
              </div>
              <div className="form-grid">
                <div className="field">
                  <span className="field-label">Product/Service Type</span>
                  <div className="multi-select-wrapper">
                    <button type="button" className="multi-select-trigger" onClick={() => toggleDropdown('productType')}>
                      {brand.productType.length === 0 ? 'Select types' : brand.productType.join(', ')}
                    </button>
                    {openDropdown === 'productType' && (
                      <div className="multi-select-options">
                        <div className="multi-select-list">
                          {PRODUCT_TYPES.map((v) => (
                            <label key={v} className="multi-select-option">
                              <input type="checkbox" checked={brand.productType.includes(v)} onChange={() => toggleProductType(v)} />
                              <span>{v}</span>
                            </label>
                          ))}
                        </div>
                        <div className="multi-select-footer">
                          <span className="multi-select-count">{brand.productType.length} selected</span>
                          <button type="button" className="multi-select-ok" onClick={() => setOpenDropdown(null)}>OK</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <label className="field">
                  <span className="field-label">Location</span>
                  <input name="location" value={brand.location} onChange={updateBrand} placeholder="City, Country" />
                </label>
              </div>
              <label className="field">
                <span className="field-label">About Your Brand</span>
                <textarea name="biography" value={brand.biography} onChange={updateBrand} rows={3} placeholder="Tell influencers about your brand..." />
              </label>
            </div>

            <div className="form-section">
              <h3><Megaphone size={16} /> Campaign Details</h3>
              <div className="form-grid">
                <div className="field">
                  <span className="field-label">Target Audience</span>
                  <div className="multi-select-wrapper">
                    <button type="button" className="multi-select-trigger" onClick={() => toggleDropdown('targetAudience')}>
                      {brand.targetAudience.length === 0 ? 'Select audience' : brand.targetAudience.join(', ')}
                    </button>
                    {openDropdown === 'targetAudience' && (
                      <div className="multi-select-options">
                        <div className="multi-select-list">
                          {TARGET_AUDIENCES.map((v) => (
                            <label key={v} className="multi-select-option">
                              <input type="checkbox" checked={brand.targetAudience.includes(v)} onChange={() => toggleTargetAudience(v)} />
                              <span>{v}</span>
                            </label>
                          ))}
                        </div>
                        <div className="multi-select-footer">
                          <span className="multi-select-count">{brand.targetAudience.length} selected</span>
                          <button type="button" className="multi-select-ok" onClick={() => setOpenDropdown(null)}>OK</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <label className="field">
                  <span className="field-label">Campaign Goals</span>
                  <input name="campaignGoals" value={brand.campaignGoals} onChange={updateBrand} placeholder="e.g. Brand awareness, Sales" />
                </label>
              </div>
              <div className="form-grid">
                <label className="field">
                  <span className="field-label">Min Budget (NPR)</span>
                  <input name="minBudget" type="number" value={brand.minBudget} onChange={updateBrand} placeholder="0" />
                </label>
                <label className="field">
                  <span className="field-label">Max Budget (NPR)</span>
                  <input name="maxBudget" type="number" value={brand.maxBudget} onChange={updateBrand} placeholder="0" />
                </label>
              </div>
              <div className="form-grid">
                <div className="field">
                  <span className="field-label">Preferred Platforms</span>
                  <div className="multi-select-wrapper">
                    <button type="button" className="multi-select-trigger" onClick={() => toggleDropdown('platforms')}>
                      {brand.preferredPlatforms.length === 0 ? 'Select platforms' : brand.preferredPlatforms.join(', ')}
                    </button>
                    {openDropdown === 'platforms' && (
                      <div className="multi-select-options">
                        <div className="multi-select-list">
                          {PLATFORMS.map((v) => (
                            <label key={v} className="multi-select-option">
                              <input type="checkbox" checked={brand.preferredPlatforms.includes(v)} onChange={() => togglePlatform(v)} />
                              <span>{v}</span>
                            </label>
                          ))}
                        </div>
                        <div className="multi-select-footer">
                          <span className="multi-select-count">{brand.preferredPlatforms.length} selected</span>
                          <button type="button" className="multi-select-ok" onClick={() => setOpenDropdown(null)}>OK</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="field">
                  <span className="field-label">Preferred Categories</span>
                  <div className="multi-select-wrapper">
                    <button
                      type="button"
                      className="multi-select-trigger"
                      onClick={() => toggleDropdown('prefCategories')}
                    >
                      {brand.preferredCategories.length === 0
                        ? 'Select categories'
                        : brand.preferredCategories.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(', ')}
                    </button>
                    {openDropdown === 'prefCategories' && (
                      <div className="multi-select-options">
                        <div className="multi-select-list">
                          {CATEGORIES.map((c) => (
                            <label key={c} className="multi-select-option">
                              <input
                                type="checkbox"
                                checked={brand.preferredCategories.includes(c)}
                                onChange={() => togglePrefCategory(c)}
                              />
                              <span>{c.charAt(0).toUpperCase() + c.slice(1)}</span>
                            </label>
                          ))}
                        </div>
                        <div className="multi-select-footer">
                          <span className="multi-select-count">{brand.preferredCategories.length} selected</span>
                          <button type="button" className="multi-select-ok" onClick={() => setOpenDropdown(null)}>OK</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="onboarding-actions">
              <button type="button" className="btn-secondary" onClick={() => setStep(1)}>
                <ArrowLeft size={16} /> Back
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : (user?.role && user.role !== 'user' ? 'Save Changes' : 'Complete Setup')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
