import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { saveInfluencerProfile, saveBrandProfile } from '../services/apiClient.js';
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

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [step, setStep] = useState(1); // 1: role, 2: details
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCatDropdown, setShowCatDropdown] = useState(false);

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
    companyName: '', industry: '', website: '', productType: '',
    targetAudience: '', campaignGoals: '', location: '', biography: '',
    minBudget: '', maxBudget: '',
    preferredPlatforms: '', preferredCategories: '',
  });

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
          minBudget: Number(brand.minBudget) || 0,
          maxBudget: Number(brand.maxBudget) || 0,
        });
      }

      // update local auth state with new role
      const token = JSON.parse(localStorage.getItem('nextgen-auth'))?.token;
      login({ token, user: { ...user, role } });
      navigate('/home', { replace: true });
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
          <h1>Set up your profile</h1>
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
          <form onSubmit={handleSubmit} className="onboarding-form">
            <div className="form-section">
              <h3><Tag size={16} /> Basic Info</h3>
              <div className="form-grid">
                <div className="field">
                  <span className="field-label">Content Category</span>
                  <div className="multi-select-wrapper">
                    <button
                      type="button"
                      className="multi-select-trigger"
                      onClick={() => setShowCatDropdown(!showCatDropdown)}
                    >
                      {inf.category.length === 0
                        ? 'Select categories'
                        : inf.category.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(', ')}
                    </button>
                    {showCatDropdown && (
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
                          <button type="button" className="multi-select-ok" onClick={() => setShowCatDropdown(false)}>OK</button>
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
                {loading ? 'Saving...' : 'Complete Setup'}
              </button>
            </div>
          </form>
        )}

        {step === 2 && role === 'brand' && (
          <form onSubmit={handleSubmit} className="onboarding-form">
            <div className="form-section">
              <h3><Building2 size={16} /> Company Info</h3>
              <div className="form-grid">
                <label className="field">
                  <span className="field-label">Company Name</span>
                  <input name="companyName" value={brand.companyName} onChange={updateBrand} placeholder="Your company" required />
                </label>
                <label className="field">
                  <span className="field-label">Industry</span>
                  <select name="industry" value={brand.industry} onChange={updateBrand} required>
                    <option value="">Select industry</option>
                    {INDUSTRIES.map((i) => (
                      <option key={i} value={i}>{i.charAt(0).toUpperCase() + i.slice(1)}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span className="field-label">Website</span>
                  <input name="website" value={brand.website} onChange={updateBrand} placeholder="https://..." />
                </label>
              </div>
              <div className="form-grid">
                <label className="field">
                  <span className="field-label">Product/Service Type</span>
                  <input name="productType" value={brand.productType} onChange={updateBrand} placeholder="e.g. Clothing, SaaS" />
                </label>
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
                <label className="field">
                  <span className="field-label">Target Audience</span>
                  <input name="targetAudience" value={brand.targetAudience} onChange={updateBrand} placeholder="e.g. Young adults in Nepal" />
                </label>
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
                <label className="field">
                  <span className="field-label">Preferred Platforms</span>
                  <input name="preferredPlatforms" value={brand.preferredPlatforms} onChange={updateBrand} placeholder="e.g. instagram, tiktok" />
                </label>
                <label className="field">
                  <span className="field-label">Preferred Categories</span>
                  <input name="preferredCategories" value={brand.preferredCategories} onChange={updateBrand} placeholder="e.g. beauty, fitness" />
                </label>
              </div>
            </div>

            <div className="onboarding-actions">
              <button type="button" className="btn-secondary" onClick={() => setStep(1)}>
                <ArrowLeft size={16} /> Back
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Complete Setup'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
