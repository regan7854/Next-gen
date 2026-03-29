import { useNavigate } from 'react-router-dom';
import { ChevronRight, Star, Users, TrendingUp, Zap, Shield, Globe } from 'lucide-react';
import Footer from '../components/Footer.jsx';
import LogoMark from '../components/LogoMark.jsx';

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
            <button className="btn-secondary btn-lg">
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
              <TrendingUp size={32} />
            </div>
            <h3>Real-Time Trending</h3>
            <p>Stay updated with the latest trends, viral content, and emerging opportunities in your niche</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Users size={32} />
            </div>
            <h3>Smart Collaborations</h3>
            <p>Find and connect with the right creators and brands for meaningful partnerships</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Star size={32} />
            </div>
            <h3>Personal Dashboard</h3>
            <p>Track your performance, engagement metrics, and growth in one intuitive dashboard</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Zap size={32} />
            </div>
            <h3>Quick Discovery</h3>
            <p>Explore curated content and networks tailored to your interests and expertise</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Shield size={32} />
            </div>
            <h3>Secure Platform</h3>
            <p>Your data and collaborations are protected with enterprise-grade security</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Globe size={32} />
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
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Create Your Profile</h3>
            <p>Sign up and tell us about yourself. Add your expertise, interests, and goals</p>
          </div>

          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Explore & Connect</h3>
            <p>Browse trending content, discover opportunities, and connect with others in your field</p>
          </div>

          <div className="step-card">
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
