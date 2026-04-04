import { useNavigate } from 'react-router-dom';
import { ChevronRight, Users } from 'lucide-react';
import Footer from '../components/Footer.jsx';
import LogoMark from '../components/LogoMark.jsx';

/* ── Custom feature icons matching the attached PNGs ── */
const IconTrending = () => (
  <svg viewBox="0 0 48 48" width="40" height="40" fill="none">
    <path d="M24 4c-2 6-8 10-8 18a12 12 0 0024 0c0-6-4-8-6-12-2 4-6 6-6 6s-1-6-4-12z"
      fill="url(#fireGrad)" stroke="#e84118" strokeWidth="1.5"/>
    <path d="M24 38a6 6 0 006-6c0-4-3-6-4-8-1 2-4 3-4 3s-.5-3-2-6c-1 3-2 5-2 9a6 6 0 006 8z"
      fill="#fdcb6e" opacity="0.85"/>
    <defs>
      <linearGradient id="fireGrad" x1="16" y1="4" x2="32" y2="42">
        <stop offset="0%" stopColor="#e84118"/>
        <stop offset="100%" stopColor="#fdcb6e"/>
      </linearGradient>
    </defs>
  </svg>
);

const IconCollab = () => (
  <svg viewBox="0 0 48 48" width="40" height="40" fill="none">
    <path d="M8 34c0-4 4-6 8-8" stroke="#1e1e2e" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M40 34c0-4-4-6-8-8" stroke="#1e1e2e" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="16" cy="18" r="5" fill="#1e1e2e"/>
    <rect x="11" y="24" width="10" height="14" rx="2" fill="#1e1e2e"/>
    <circle cx="32" cy="18" r="5" fill="#1e1e2e"/>
    <rect x="27" y="24" width="10" height="14" rx="2" fill="#1e1e2e"/>
    <path d="M20 30h8" stroke="#6c5ce7" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M22 28l-2 2 2 2" stroke="#6c5ce7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M26 28l2 2-2 2" stroke="#6c5ce7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconDashboard = () => (
  <svg viewBox="0 0 48 48" width="40" height="40" fill="none">
    <rect x="6" y="8" width="36" height="28" rx="3" stroke="#1e1e2e" strokeWidth="2.5"/>
    <rect x="6" y="8" width="36" height="6" rx="3" fill="#1e1e2e"/>
    <circle cx="10" cy="11" r="1.2" fill="#e84118"/>
    <circle cx="14" cy="11" r="1.2" fill="#fdcb6e"/>
    <circle cx="18" cy="11" r="1.2" fill="#00b894"/>
    <polyline points="12,30 18,24 24,28 30,20 36,22" stroke="#6c5ce7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="12" y="32" width="6" height="1.5" rx="0.75" fill="#ddd"/>
    <rect x="22" y="32" width="4" height="1.5" rx="0.75" fill="#ddd"/>
    <line x1="18" y1="40" x2="30" y2="40" stroke="#1e1e2e" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

const IconDiscovery = () => (
  <svg viewBox="0 0 48 48" width="40" height="40" fill="none">
    <circle cx="24" cy="24" r="18" stroke="#1e1e2e" strokeWidth="2.5"/>
    <polygon points="20,14 34,24 20,34" fill="url(#compGrad)" opacity="0.9"/>
    <circle cx="24" cy="24" r="3" fill="#1e1e2e"/>
    <line x1="24" y1="6" x2="24" y2="10" stroke="#1e1e2e" strokeWidth="2" strokeLinecap="round"/>
    <line x1="24" y1="38" x2="24" y2="42" stroke="#1e1e2e" strokeWidth="2" strokeLinecap="round"/>
    <line x1="6" y1="24" x2="10" y2="24" stroke="#1e1e2e" strokeWidth="2" strokeLinecap="round"/>
    <line x1="38" y1="24" x2="42" y2="24" stroke="#1e1e2e" strokeWidth="2" strokeLinecap="round"/>
    <defs>
      <linearGradient id="compGrad" x1="20" y1="14" x2="34" y2="34">
        <stop offset="0%" stopColor="#6c5ce7"/>
        <stop offset="100%" stopColor="#a29bfe"/>
      </linearGradient>
    </defs>
  </svg>
);

const IconSecurity = () => (
  <svg viewBox="0 0 48 48" width="40" height="40" fill="none">
    <circle cx="24" cy="24" r="18" stroke="#1e1e2e" strokeWidth="2.5"/>
    <rect x="17" y="20" width="14" height="12" rx="2" stroke="#1e1e2e" strokeWidth="2"/>
    <path d="M20 20v-3a4 4 0 018 0v3" stroke="#1e1e2e" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="24" cy="26" r="2" fill="#6c5ce7"/>
    <line x1="24" y1="28" x2="24" y2="30" stroke="#6c5ce7" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconGlobal = () => (
  <svg viewBox="0 0 48 48" width="40" height="40" fill="none">
    <circle cx="24" cy="24" r="18" stroke="#1e1e2e" strokeWidth="2.5"/>
    <ellipse cx="24" cy="24" rx="9" ry="18" stroke="#1e1e2e" strokeWidth="1.5"/>
    <line x1="6" y1="24" x2="42" y2="24" stroke="#1e1e2e" strokeWidth="1.5"/>
    <line x1="8" y1="16" x2="40" y2="16" stroke="#1e1e2e" strokeWidth="1"/>
    <line x1="8" y1="32" x2="40" y2="32" stroke="#1e1e2e" strokeWidth="1"/>
    <circle cx="34" cy="12" r="3" fill="#00b894"/>
    <circle cx="14" cy="32" r="2.5" fill="#6c5ce7"/>
    <circle cx="32" cy="34" r="2" fill="#fdcb6e"/>
  </svg>
);

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="landing-navbar">
        <div className="landing-navbar-inner">
          <div className="navbar-brand">
            <LogoMark size={28} />
            <span>NextGen</span>
          </div>
          <button className="btn-primary" onClick={() => navigate('/auth')}>
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Connect with Creators, Brands & Opportunities
          </h1>
          <p className="hero-subtitle">
            Discover trending content, collaborate with influencers, and build your personal brand on NextGen
          </p>
          <div className="hero-actions">
            <button 
              className="btn-primary btn-lg"
              onClick={() => navigate('/auth')}
            >
              Get Started Now
              <ChevronRight size={18} />
            </button>
            <button className="btn-secondary btn-lg" onClick={() => document.querySelector('.features-section')?.scrollIntoView({ behavior: 'smooth' })}>
              Learn More
            </button>
          </div>
          <div className="hero-stats">
            <div className="stat-box">
              <div className="stat-number">50K+</div>
              <div className="stat-label">Active Creators</div>
            </div>
            <div className="stat-box">
              <div className="stat-number">1000+</div>
              <div className="stat-label">Brands</div>
            </div>
            <div className="stat-box">
              <div className="stat-number">10M+</div>
              <div className="stat-label">Daily Engagements</div>
            </div>
          </div>
        </div>
        <div className="hero-image">
          <div className="hero-placeholder">
            <Users size={120} strokeWidth={0.5} />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2>Powerful Features for Success</h2>
          <p>Everything you need to grow your influence and build meaningful connections</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <IconTrending />
            </div>
            <h3>Real-Time Trending</h3>
            <p>Stay updated with the latest trends, viral content, and emerging opportunities in your niche</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <IconCollab />
            </div>
            <h3>Smart Collaborations</h3>
            <p>Find and connect with the right creators and brands for meaningful partnerships</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <IconDashboard />
            </div>
            <h3>Personal Dashboard</h3>
            <p>Track your performance, engagement metrics, and growth in one intuitive dashboard</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <IconDiscovery />
            </div>
            <h3>Quick Discovery</h3>
            <p>Explore curated content and networks tailored to your interests and expertise</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <IconSecurity />
            </div>
            <h3>Secure Platform</h3>
            <p>Your data and collaborations are protected with enterprise-grade security</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <IconGlobal />
            </div>
            <h3>Global Network</h3>
            <p>Connect with creators and brands from around the world at any time</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="section-header">
          <h2>How It Works</h2>
          <p>Get started in three simple steps</p>
        </div>

        <div className="steps-grid">
          <div className="step-card" onClick={() => navigate('/auth')} role="button" tabIndex={0}>
            <div className="step-number">1</div>
            <h3>Create Your Profile</h3>
            <p>Sign up and tell us about yourself. Add your expertise, interests, and goals</p>
          </div>

          <div className="step-card" onClick={() => navigate('/auth')} role="button" tabIndex={0}>
            <div className="step-number">2</div>
            <h3>Explore & Connect</h3>
            <p>Browse trending content, discover opportunities, and connect with others in your field</p>
          </div>

          <div className="step-card" onClick={() => navigate('/auth')} role="button" tabIndex={0}>
            <div className="step-number">3</div>
            <h3>Grow & Collaborate</h3>
            <p>Build partnerships, grow your audience, and achieve your goals together</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Start Your Journey?</h2>
          <p>Join thousands of creators building their success on NextGen</p>
          <button 
            className="btn-primary btn-lg"
            onClick={() => navigate('/auth')}
          >
            Sign Up for Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
