import React from 'react';
import { Link } from 'react-router-dom';
import { Layout, Shield, TrendingUp, Users, ArrowRight, CheckCircle, Database } from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="landing-wrapper" style={{ backgroundColor: 'var(--vriksha-light-bg)' }}>
            {/* 1. TOP NAVBAR */}
            <nav className="landing-navbar">
                <div className="navbar-logo">
                    <div style={{ backgroundColor: 'var(--vriksha-green)', padding: '8px', borderRadius: '12px', display: 'flex' }}>
                        <Layout size={24} color="white" />
                    </div>
                    <span>Vriksha</span>
                </div>
            </nav>

            {/* 2. HERO SECTION */}
            <section className="hero-section">
                <h1 className="hero-heading">Vriksha – Project & Deal Visibility, Simplified</h1>
                <p className="hero-subheading">
                    Track projects stage-wise, monitor progress, and maintain full lifecycle visibility.
                </p>
                <Link to="/login" className="btn-hero-cta">Go to Dashboard</Link>

                <div className="hero-mockup-wrapper">
                    <div className="mockup-preview">
                        <div style={{ padding: '2rem', width: '100%' }}>
                            <div style={{ height: '20px', width: '60%', background: '#e2e8f0', borderRadius: '10px', marginBottom: '2rem' }}></div>
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} style={{ flex: 1, height: '100px', background: 'white', borderRadius: '12px', border: '1px solid #edf2f7' }}></div>
                                ))}
                            </div>
                            <div style={{ height: '40px', width: '100%', background: 'linear-gradient(90deg, #a8d5ba 30%, #e2e8f0 30%)', borderRadius: '20px' }}></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. FEATURES SECTION */}
            <section className="features-container">
                <div className="features-grid">
                    <div className="feature-card" style={{ backgroundColor: 'var(--vriksha-green)', opacity: 0.9 }}>
                        <div className="feature-icon"><TrendingUp size={24} /></div>
                        <h3>Stage-wise Project Tracking</h3>
                        <p>Monitor your deals through every milestone with precision.</p>
                    </div>
                    <div className="feature-card" style={{ backgroundColor: 'var(--vriksha-blue)', opacity: 0.9 }}>
                        <div className="feature-icon"><Shield size={24} /></div>
                        <h3>Admin-Controlled Access</h3>
                        <p>Secure environment with fine-grained permission management.</p>
                    </div>
                    <div className="feature-card" style={{ backgroundColor: 'var(--vriksha-lavender)', opacity: 0.9 }}>
                        <div className="feature-icon"><Layout size={24} /></div>
                        <h3>Visual Progress Journey</h3>
                        <p>Beautiful timelines that tell the story of your project growth.</p>
                    </div>
                    <div className="feature-card" style={{ backgroundColor: 'var(--vriksha-peach)', opacity: 0.9 }}>
                        <div className="feature-icon"><Users size={24} /></div>
                        <h3>Team & Ownership Visibility</h3>
                        <p>Clear ownership tracking for better accountability and collaboration.</p>
                    </div>
                </div>
            </section>

            {/* 4. HOW IT WORKS */}
            <section className="flow-section">
                <h2 className="flow-title">How It Works</h2>
                <div className="flow-container">
                    <div className="flow-step">
                        <div className="step-circle"><Database size={32} /></div>
                        <p style={{ fontWeight: 700 }}>Admin adds users</p>
                    </div>
                    <div className="flow-connector"></div>
                    <div className="flow-step">
                        <div className="step-circle"><Users size={32} /></div>
                        <p style={{ fontWeight: 700 }}>Users manage projects</p>
                    </div>
                    <div className="flow-connector"></div>
                    <div className="flow-step">
                        <div className="step-circle"><TrendingUp size={32} /></div>
                        <p style={{ fontWeight: 700 }}>System tracks progress</p>
                    </div>
                </div>
            </section>

            {/* 5. FOOTER */}
            <footer className="landing-footer">
                <p>Vriksha – Internal Project Tracking Platform</p>
            </footer>
        </div>
    );
};

export default LandingPage;
