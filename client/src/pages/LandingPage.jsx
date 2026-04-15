import { useNavigate } from 'react-router-dom';
import { TrendingUp, Users, BarChart3, Search } from 'lucide-react';
import Footer from '../components/Footer.jsx';
import LogoMark from '../components/LogoMark.jsx';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">

      {/* Navbar */}
      <nav className="landing-navbar">
        <div className="lp-container lp-nav-inner">
          <div className="navbar-brand">
            <LogoMark height={72} />
          </div>
          <div className="lp-nav-right">
            <button className="lp-login" onClick={() => navigate('/auth')}>Log in</button>
            <button className="lp-btn" onClick={() => navigate('/auth')}>Sign up</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-container">
          <span className="lp-eyebrow">for creators &amp; brands</span>
          <h1 className="lp-title">Find your next<br />collab.</h1>
          <p className="lp-subtitle">
            Every creator needs a stage. Every brand needs a voice.<br />
            NextGen is where you perform.
          </p>
          <div className="lp-hero-cta">
            <button className="lp-btn lp-btn-lg" onClick={() => navigate('/auth')}>
              Get started free
            </button>
            <span className="lp-fine">No credit card required</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="lp-features">
        <div className="lp-container">
          <p className="lp-section-label">what you get</p>
          <div className="lp-bento">
            <div className="lp-card">
              <div className="lp-card-icon"><TrendingUp size={20} /></div>
              <h3>Trending</h3>
              <p>See what's actually gaining momentum updated in real time. Know what's working before everyone else does.</p>
            </div>
            <div className="lp-card">
              <div className="lp-card-icon"><Search size={20} /></div>
              <h3>Discover</h3>
              <p>Search creators and brands by niche, size, or content style.</p>
            </div>
            <div className="lp-card">
              <div className="lp-card-icon"><Users size={20} /></div>
              <h3>Collaborate</h3>
              <p>Pitch and lock in partnerships all in one place.</p>
            </div>
            <div className="lp-card">
              <div className="lp-card-icon"><BarChart3 size={20} /></div>
              <h3>Track</h3>
              <p>One dashboard for your stats, active collabs, and everything in between. No spreadsheets needed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="lp-how">
        <div className="lp-container">
          <p className="lp-section-label">how it works</p>
          <div className="lp-steps">
            <div className="lp-step">
              <span className="lp-step-num">01</span>
              <div className="lp-step-body">
                <h3>Set up your profile</h3>
                <p>Tell us who you are — creator, brand, or both.</p>
              </div>
            </div>
            <div className="lp-step">
              <span className="lp-step-num">02</span>
              <div className="lp-step-body">
                <h3>Browse &amp; discover</h3>
                <p>Find people that actually match what you're looking for.</p>
              </div>
            </div>
            <div className="lp-step">
              <span className="lp-step-num">03</span>
              <div className="lp-step-body">
                <h3>Make it happen</h3>
                <p>Connect, agree on terms, and start working together.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta">
        <div className="lp-container">
          <p className="lp-section-label">get started</p>
          <h2>Ready when you are.</h2>
          <p className="lp-cta-sub">Join creators and brands already using NextGen.</p>
          <button className="lp-btn lp-btn-lg" onClick={() => navigate('/auth')}>
            Create an account
          </button>
        </div>
      </section>

      <div className="lp-footer-wrap">
        <Footer />
      </div>

    </div>
  );
}
