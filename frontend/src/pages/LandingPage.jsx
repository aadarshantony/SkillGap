import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Users,
  Award,
  Briefcase,
  Calendar,
  ShieldCheck,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  FileText,
  Target,
  Building2,
  HelpCircle,
  CheckCircle,
  BarChart2,
  Clock,
  Search,
  BookOpen,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [ecosystemTab, setEcosystemTab] = useState('learner'); // 'learner' | 'employer'
  const [pricingSegment, setPricingSegment] = useState('candidate'); // 'candidate' | 'employer'
  const [isAnnual, setIsAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState([0]); // Index of open FAQs

  const toggleFaq = (index) => {
    if (openFaq.includes(index)) {
      setOpenFaq(openFaq.filter((i) => i !== index));
    } else {
      setOpenFaq([...openFaq, index]);
    }
  };

  const handleDashboardRedirect = () => {
    if (!user) {
      navigate('/login');
    } else if (user.role === 'employer') {
      navigate('/employer');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="landing-page">
      {/* Ambient Background Lights */}
      <div className="ambient-glow glow-top-left"></div>
      <div className="ambient-glow glow-center-right"></div>
      <div className="ambient-glow glow-bottom-left"></div>

      {/* Sticky Glass Navbar */}
      <nav className="landing-nav">
        <div className="landing-nav-container">
          <div className="landing-brand" onClick={() => navigate('/')}>
            <div className="landing-brand-text">SKILLGAP</div>
          </div>

          <ul className="landing-nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#ecosystem">Platform</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#comparison">Why SkillGap</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>

          <div className="landing-nav-actions">
            {user ? (
              <button className="btn-glow-primary" onClick={handleDashboardRedirect}>
                Go to Dashboard <ArrowRight size={16} />
              </button>
            ) : (
              <>
                <button className="btn-glass-secondary" onClick={() => navigate('/login')}>
                  Sign In
                </button>
                <button className="btn-glow-primary" onClick={() => navigate('/signup')}>
                  Get Started <ArrowRight size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="hero-section">
        <h1 className="hero-title">
          BRIDGE THE SKILL GAP.<br />
          <span className="gradient-text-accent">MASTER MARKET DEMAND.</span>
        </h1>

        <p className="hero-subtitle">
          SkillGap bridges candidates and top employers using real-time market pulse analytics, AI skill gap diagnostics, adaptive learning paths, and non-repetitive skill assessment verification.
        </p>

        <div className="hero-actions">
          <button className="btn-glow-primary" onClick={() => navigate(user ? '/dashboard' : '/signup?role=learner')}>
            Explore as Candidate <ArrowRight size={18} />
          </button>
          <button className="btn-glass-secondary" onClick={() => navigate(user ? '/employer' : '/signup?role=employer')}>
            Hire Verified Talent <Building2 size={18} />
          </button>
        </div>

        {/* Live Stats Ribbon */}
        <div className="hero-stats-grid">
          <div className="stat-card-glass">
            <div className="stat-value">31+</div>
            <div className="stat-label">Multi-Industry Taxonomies (Tech, HR, Healthcare, Finance, Sales)</div>
          </div>
          <div className="stat-card-glass">
            <div className="stat-value">961+</div>
            <div className="stat-label">Daily Real-Time Skill Demand Trend Signals</div>
          </div>
          <div className="stat-card-glass">
            <div className="stat-value">100%</div>
            <div className="stat-label">Verified Skill Assessment Badge Authenticity</div>
          </div>
          <div className="stat-card-glass">
            <div className="stat-value">3.2x</div>
            <div className="stat-label">Faster Employer Candidate Screening Cycle</div>
          </div>
        </div>
      </header>

      {/* DUAL ECOSYSTEM SECTION */}
      <section className="section-container" id="ecosystem">
        <div className="section-header">
          <span className="section-tag">DUAL ECOSYSTEM</span>
          <h2 className="section-title">BUILT FOR BOTH SIDES OF THE HIRING TABLE</h2>
          <p className="section-desc">
            Whether you are accelerating your career or building high-performing teams, SkillGap provides tailored intelligent tools.
          </p>
        </div>

        {/* Ecosystem Tabs */}
        <div className="ecosystem-tabs">
          <button
            className={`tab-btn ${ecosystemTab === 'learner' ? 'active' : ''}`}
            onClick={() => setEcosystemTab('learner')}
          >
            <Sparkles size={18} className="tab-icon" /> For Job Seekers & Learners
          </button>
          <button
            className={`tab-btn ${ecosystemTab === 'employer' ? 'active' : ''}`}
            onClick={() => setEcosystemTab('employer')}
          >
            <Building2 size={18} className="tab-icon" /> For Employers & Recruiters
          </button>
        </div>

        {/* Tab Contents */}
        {ecosystemTab === 'learner' ? (
          <div className="showcase-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Target size={24} />
              </div>
              <h3 className="feature-title">AI Skill Gap Diagnostics</h3>
              <p className="feature-desc">
                Diagnose exact skill gaps between your current profile and target job roles across IT, HR, Sales, Healthcare, Finance, Ops, and Legal.
              </p>
              <ul className="feature-list">
                <li className="feature-item"><CheckCircle size={16} className="check-icon" /> Multi-career taxonomy breakdown</li>
                <li className="feature-item"><CheckCircle size={16} className="check-icon" /> Instant missing skill identification</li>
                <li className="feature-item"><CheckCircle size={16} className="check-icon" /> Dynamic role readiness score</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <BookOpen size={24} />
              </div>
              <h3 className="feature-title">Adaptive Learning Paths</h3>
              <p className="feature-desc">
                Step-by-step personalized learning paths curated from top verified sources like W3Schools, GeeksForGeeks, Coursera, and freeCodeCamp.
              </p>
              <ul className="feature-list">
                <li className="feature-item"><CheckCircle size={16} className="check-icon" /> Direct links to authentic learning modules</li>
                <li className="feature-item"><CheckCircle size={16} className="check-icon" /> Estimated completion time breakdown</li>
                <li className="feature-item"><CheckCircle size={16} className="check-icon" /> Automated path progression tracking</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Award size={24} />
              </div>
              <h3 className="feature-title">Verified Skill Badges</h3>
              <p className="feature-desc">
                Take AI-generated skill assessments tailored specifically to your target domain with non-repetitive question banks and instant badge issuing.
              </p>
              <ul className="feature-list">
                <li className="feature-item"><CheckCircle size={16} className="check-icon" /> Public verifiable URL credentials (/verify/:id)</li>
                <li className="feature-item"><CheckCircle size={16} className="check-icon" /> Non-generic skill-focused test questions</li>
                <li className="feature-item"><CheckCircle size={16} className="check-icon" /> Automatic assessment exemption on job applications</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <TrendingUp size={24} />
              </div>
              <h3 className="feature-title">Market Pulse & Demand Trends</h3>
              <p className="feature-desc">
                Real-time 30-day market demand line/bar charts showing high-demand, stable, and rare niche skills with live salary indicators.
              </p>
              <ul className="feature-list">
                <li className="feature-item"><CheckCircle size={16} className="check-icon" /> Daily demand signal tracking</li>
                <li className="feature-item"><CheckCircle size={16} className="check-icon" /> High-demand vs Rare skill heatmaps</li>
                <li className="feature-item"><CheckCircle size={16} className="check-icon" /> Strategic career pivot suggestions</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="showcase-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <FileText size={24} />
              </div>
              <h3 className="feature-title">AI JD Quality & Requirement Analyzer</h3>
              <p className="feature-desc">
                Analyze job descriptions in seconds to detect realistic vs AI-generated inflated requirements and generate high-converting structured JDs.
              </p>
              <ul className="feature-list">
                <li className="feature-item"><CheckCircle size={16} className="check-icon" /> Quality score rating (0–100)</li>
                <li className="feature-item"><CheckCircle size={16} className="check-icon" /> Unrealistic requirement detection</li>
                <li className="feature-item"><CheckCircle size={16} className="check-icon" /> 1-click structured JD rewrite generator</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <BarChart2 size={24} />
              </div>
              <h3 className="feature-title">Applicant Rejection Insights</h3>
              <p className="feature-desc">
                Uncover pinpoint leakages in your candidate evaluation pipeline and understand exact skill gap causes behind applicant falloffs.
              </p>
              <ul className="feature-list">
                <li className="feature-item"><CheckCircle size={16} className="check-icon" /> Skill gap cause breakdown</li>
                <li className="feature-item"><CheckCircle size={16} className="check-icon" /> Stage-by-stage drop-off analytics</li>
                <li className="feature-item"><CheckCircle size={16} className="check-icon" /> Actionable recruitment recommendations</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Calendar size={24} />
              </div>
              <h3 className="feature-title">Real-Time Interview Calendar Grid</h3>
              <p className="feature-desc">
                Integrated 35/42-cell monthly calendar grid synced directly with candidate applications, real-time MongoDB database, and Google/ICS exports.
              </p>
              <ul className="feature-list">
                <li className="feature-item"><CheckCircle size={16} className="check-icon" /> Visual day-by-day event badges</li>
                <li className="feature-item"><CheckCircle size={16} className="check-icon" /> Direct Google Calendar & .ics file exports</li>
                <li className="feature-item"><CheckCircle size={16} className="check-icon" /> Candidate meeting links & modal inspector</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Users size={24} />
              </div>
              <h3 className="feature-title">Pre-Verified Candidate Talent Search</h3>
              <p className="feature-desc">
                Filter and invite candidate talent directly by verified skill badges, eliminating standard test fatigue for pre-validated candidates.
              </p>
              <ul className="feature-list">
                <li className="feature-item"><CheckCircle size={16} className="check-icon" /> Filter candidates by verified skill badges</li>
                <li className="feature-item"><CheckCircle size={16} className="check-icon" /> Automatic test exemption badge filter</li>
                <li className="feature-item"><CheckCircle size={16} className="check-icon" /> Job-specific applicant filtering without noise</li>
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* DETAILED FEATURE HIGHLIGHTS */}
      <section className="section-container" id="features">
        <div className="section-header">
          <span className="section-tag">ENGINEERED FOR EXCELLENCE</span>
          <h2 className="section-title">INTELLIGENT CAPABILITIES AT A GLANCE</h2>
        </div>

        <div className="showcase-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper" style={{ color: 'var(--accent)' }}>
              <Zap size={24} />
            </div>
            <h3 className="feature-title">Real-Time Market Pulse</h3>
            <p className="feature-desc">
              Track multi-industry demand trends across 960+ daily signals to ensure learning paths align with active employer demand.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper" style={{ color: 'var(--green)' }}>
              <ShieldCheck size={24} />
            </div>
            <h3 className="feature-title">Test Exemption Engine</h3>
            <p className="feature-desc">
              Once a candidate completes a skill assessment for one job, future applications matching that skill automatically skip redundant testing.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper" style={{ color: 'var(--purple)' }}>
              <Sparkles size={24} />
            </div>
            <h3 className="feature-title">Non-Coding & Tech Taxonomies</h3>
            <p className="feature-desc">
              Full multi-industry coverage including HR, Sales Executive, Lawyer, Teacher, Marketing, Accounting, Ops Manager, and Healthcare.
            </p>
          </div>
        </div>
      </section>

      {/* PRICING MODEL SECTION */}
      <section className="section-container pricing-section" id="pricing">
        <div className="section-header">
          <span className="section-tag">TRANSPARENT PRICING</span>
          <h2 className="section-title">TAILORED PLANS FOR CANDIDATES & EMPLOYERS</h2>
          <p className="section-desc">
            Choose a plan designed for individual career growth or enterprise hiring scalability.
          </p>
        </div>

        {/* Pricing Controls */}
        <div className="pricing-controls">
          {/* Segment Selector */}
          <div className="segment-toggle">
            <button
              className={`segment-btn ${pricingSegment === 'candidate' ? 'active' : ''}`}
              onClick={() => setPricingSegment('candidate')}
            >
              For Candidates & Job Seekers
            </button>
            <button
              className={`segment-btn ${pricingSegment === 'employer' ? 'active' : ''}`}
              onClick={() => setPricingSegment('employer')}
            >
              For Employers & Hiring Teams
            </button>
          </div>

          {/* Billing Toggle */}
          <div className="billing-toggle">
            <span style={{ color: !isAnnual ? '#fff' : 'var(--text-2)', fontWeight: !isAnnual ? 600 : 400 }}>Monthly Billing</span>
            <label className="switch">
              <input type="checkbox" checked={isAnnual} onChange={(e) => setIsAnnual(e.target.checked)} />
              <span className="slider"></span>
            </label>
            <span style={{ color: isAnnual ? '#fff' : 'var(--text-2)', fontWeight: isAnnual ? 600 : 400 }}>
              Annual Billing <span className="discount-badge">Save 20%</span>
            </span>
          </div>
        </div>

        {/* PRICING CARDS: CANDIDATE vs EMPLOYER */}
        {pricingSegment === 'candidate' ? (
          <div className="pricing-grid">
            {/* Free Starter */}
            <div className="pricing-card">
              <div>
                <h3 className="plan-name">Career Starter</h3>
                <p className="plan-desc">For candidates beginning their skill diagnostic and career path journey.</p>
                <div className="plan-price-box">
                  <span className="plan-price">$0</span>
                  <span className="plan-period">/ forever free</span>
                </div>
                <div className="plan-features-title">Includes:</div>
                <ul className="plan-features-list">
                  <li className="plan-feature-item"><CheckCircle size={16} className="check-icon" /> 1 Active Target Role Skill Gap Diagnostic</li>
                  <li className="plan-feature-item"><CheckCircle size={16} className="check-icon" /> Access to Public Job Board & Application Flow</li>
                  <li className="plan-feature-item"><CheckCircle size={16} className="check-icon" /> Basic Learning Path Course Recommendations</li>
                  <li className="plan-feature-item"><CheckCircle size={16} className="check-icon" /> 3 AI Skill Assessments per month</li>
                </ul>
              </div>
              <button className="plan-cta-btn" onClick={() => navigate('/signup?role=learner')}>
                Start For Free
              </button>
            </div>

            {/* Pro Candidate (POPULAR) */}
            <div className="pricing-card popular">
              <div className="popular-badge">MOST POPULAR</div>
              <div>
                <h3 className="plan-name" style={{ color: 'var(--accent)' }}>Pro Accelerator</h3>
                <p className="plan-desc">For serious job seekers aiming to master high-demand skills and stand out to employers.</p>
                <div className="plan-price-box">
                  <span className="plan-price">${isAnnual ? '15' : '19'}</span>
                  <span className="plan-period">/ month {isAnnual ? '(billed annually)' : ''}</span>
                </div>
                <div className="plan-features-title">Everything in Free, plus:</div>
                <ul className="plan-features-list">
                  <li className="plan-feature-item"><CheckCircle size={16} className="check-icon" /> <strong>Unlimited</strong> AI Skill Gap Diagnostics (Tech & Non-Coding)</li>
                  <li className="plan-feature-item"><CheckCircle size={16} className="check-icon" /> <strong>Unlimited</strong> AI Skill Assessments & Instant Badges</li>
                  <li className="plan-feature-item"><CheckCircle size={16} className="check-icon" /> Personalized Adaptive Learning Path Generator</li>
                  <li className="plan-feature-item"><CheckCircle size={16} className="check-icon" /> Full Access to 30-Day Real-Time Market Pulse Trends</li>
                  <li className="plan-feature-item"><CheckCircle size={16} className="check-icon" /> <strong>Automatic Skill Test Exemption Badge</strong></li>
                  <li className="plan-feature-item"><CheckCircle size={16} className="check-icon" /> Priority Applicant Spotlight in Employer Talent Search</li>
                </ul>
              </div>
              <button className="plan-cta-btn" onClick={() => navigate('/signup?role=learner')}>
                Start 14-Day Free Trial
              </button>
            </div>

            {/* Lifetime Mastery */}
            <div className="pricing-card">
              <div>
                <h3 className="plan-name">Career Mastery</h3>
                <p className="plan-desc">Lifetime access and dedicated AI tools for long-term professional growth.</p>
                <div className="plan-price-box">
                  <span className="plan-price">$199</span>
                  <span className="plan-period">/ one-time payment</span>
                </div>
                <div className="plan-features-title">Everything in Pro, plus:</div>
                <ul className="plan-features-list">
                  <li className="plan-feature-item"><CheckCircle size={16} className="check-icon" /> Lifetime Unlimited Access to all candidate features</li>
                  <li className="plan-feature-item"><CheckCircle size={16} className="check-icon" /> Verifiable Public URL Badge Credentials (/verify/:id)</li>
                  <li className="plan-feature-item"><CheckCircle size={16} className="check-icon" /> AI Resume & Portfolio Skill Alignment Optimization</li>
                  <li className="plan-feature-item"><CheckCircle size={16} className="check-icon" /> Direct Candidate Referral Tag for Employer Search</li>
                </ul>
              </div>
              <button className="plan-cta-btn" onClick={() => navigate('/signup?role=learner')}>
                Get Lifetime Access
              </button>
            </div>
          </div>
        ) : (
          <div className="pricing-grid">
            {/* Hiring Starter */}
            <div className="pricing-card">
              <div>
                <h3 className="plan-name">Hiring Growth</h3>
                <p className="plan-desc">For growing companies posting roles and verifying candidate skill quality.</p>
                <div className="plan-price-box">
                  <span className="plan-price">${isAnnual ? '79' : '99'}</span>
                  <span className="plan-period">/ month {isAnnual ? '(billed annually)' : ''}</span>
                </div>
                <div className="plan-features-title">Includes:</div>
                <ul className="plan-features-list">
                  <li className="plan-feature-item"><CheckCircle size={16} className="check-icon" /> Up to <strong>5 Active Job Postings</strong></li>
                  <li className="plan-feature-item"><CheckCircle size={16} className="check-icon" /> AI Job Description Quality & Requirement Analyzer</li>
                  <li className="plan-feature-item"><CheckCircle size={16} className="check-icon" /> Candidate Applicant Skill Verification Dashboard</li>
                  <li className="plan-feature-item"><CheckCircle size={16} className="check-icon" /> 50 Pre-Verified Candidate Profile Unlocks / month</li>
                </ul>
              </div>
              <button className="plan-cta-btn" onClick={() => navigate('/signup?role=employer')}>
                Start Employer Trial
              </button>
            </div>

            {/* Scale Hiring (POPULAR) */}
            <div className="pricing-card popular">
              <div className="popular-badge">RECOMMENDED FOR TEAMS</div>
              <div>
                <h3 className="plan-name" style={{ color: 'var(--accent)' }}>Scale Hiring</h3>
                <p className="plan-desc">Full suite of recruitment analytics, JD tools, rejection insights, and calendar sync.</p>
                <div className="plan-price-box">
                  <span className="plan-price">${isAnnual ? '239' : '299'}</span>
                  <span className="plan-period">/ month {isAnnual ? '(billed annually)' : ''}</span>
                </div>
                <div className="plan-features-title">Everything in Growth, plus:</div>
                <ul className="plan-features-list">
                  <li className="plan-feature-item"><CheckCircle size={16} className="check-icon" /> Up to <strong>25 Active Job Postings</strong></li>
                  <li className="plan-feature-item"><CheckCircle size={16} className="check-icon" /> <strong>Applicant Rejection Insights Engine</strong></li>
                  <li className="plan-feature-item"><CheckCircle size={16} className="check-icon" /> <strong>Integrated Visual Monthly Interview Calendar</strong></li>
                  <li className="plan-feature-item"><CheckCircle size={16} className="check-icon" /> Direct Google Calendar & .ics File Event Exports</li>
                  <li className="plan-feature-item"><CheckCircle size={16} className="check-icon" /> 500 Candidate Talent Search Unlocks / month</li>
                  <li className="plan-feature-item"><CheckCircle size={16} className="check-icon" /> 3 Recruiter Team Member Seats</li>
                </ul>
              </div>
              <button className="plan-cta-btn" onClick={() => navigate('/signup?role=employer')}>
                Scale Hiring Now
              </button>
            </div>

            {/* Enterprise */}
            <div className="pricing-card">
              <div>
                <h3 className="plan-name">Enterprise Talent</h3>
                <p className="plan-desc">For large enterprise organizations requiring custom taxonomies and dedicated support.</p>
                <div className="plan-price-box">
                  <span className="plan-price">${isAnnual ? '639' : '799'}</span>
                  <span className="plan-period">/ month</span>
                </div>
                <div className="plan-features-title">Everything in Scale, plus:</div>
                <ul className="plan-features-list">
                  <li className="plan-feature-item"><CheckCircle size={16} className="check-icon" /> <strong>Unlimited Active Job Postings</strong></li>
                  <li className="plan-feature-item"><CheckCircle size={16} className="check-icon" /> Custom Skill Taxonomy & Private Badge Creation</li>
                  <li className="plan-feature-item"><CheckCircle size={16} className="check-icon" /> Dedicated Hiring Account Manager & ATS Integration</li>
                  <li className="plan-feature-item"><CheckCircle size={16} className="check-icon" /> Unlimited Talent Search & Direct Candidate Outreach</li>
                </ul>
              </div>
              <button className="plan-cta-btn" onClick={() => navigate('/signup?role=employer')}>
                Contact Sales
              </button>
            </div>
          </div>
        )}
      </section>

      {/* COMPARISON MATRIX SECTION */}
      <section className="section-container" id="comparison">
        <div className="section-header">
          <span className="section-tag">WHY SKILLGAP</span>
          <h2 className="section-title">THE OLD WAY VS THE SKILLGAP ADVANTAGE</h2>
        </div>

        <div className="comparison-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Feature / Capability</th>
                <th style={{ color: 'var(--text-3)' }}>Traditional Job Boards</th>
                <th style={{ color: 'var(--accent)' }}>SkillGap AI Platform</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Skill Gap Analysis</strong></td>
                <td>Manual resume scanning with vague rejection notes</td>
                <td style={{ color: '#fff' }}><CheckCircle size={16} className="check-icon" /> Instant pinpoint AI skill gap breakdown for 31+ roles</td>
              </tr>
              <tr>
                <td><strong>Learning Paths</strong></td>
                <td>Generic courses, unverified videos, dead links</td>
                <td style={{ color: '#fff' }}><CheckCircle size={16} className="check-icon" /> Curated authentic paths (W3Schools, GFG, Coursera)</td>
              </tr>
              <tr>
                <td><strong>Skill Assessment</strong></td>
                <td>Repetitive, identical tests for every single application</td>
                <td style={{ color: '#fff' }}><CheckCircle size={16} className="check-icon" /> Dynamic non-repetitive AI tests & Automatic Exemption Badge</td>
              </tr>
              <tr>
                <td><strong>Market Demand Insights</strong></td>
                <td>Outdated static salary reports</td>
                <td style={{ color: '#fff' }}><CheckCircle size={16} className="check-icon" /> 30-day real-time Market Pulse trend graphs & heatmaps</td>
              </tr>
              <tr>
                <td><strong>Job Descriptions</strong></td>
                <td>Inflated AI-generated buzzwords & unrealistic expectations</td>
                <td style={{ color: '#fff' }}><CheckCircle size={16} className="check-icon" /> AI JD Quality Score & Requirement Reality Analyzer</td>
              </tr>
              <tr>
                <td><strong>Interview Scheduling</strong></td>
                <td>Disjointed email back-and-forth threads</td>
                <td style={{ color: '#fff' }}><CheckCircle size={16} className="check-icon" /> Real-Time Monthly Calendar Grid with Google & .ics Sync</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS */}
      <section className="section-container" id="faq">
        <div className="section-header">
          <span className="section-tag">GOT QUESTIONS?</span>
          <h2 className="section-title">FREQUENTLY ASKED QUESTIONS</h2>
        </div>

        <div className="faq-grid">
          {[
            {
              q: 'How does SkillGap calculate skill gaps for non-coding roles?',
              a: 'SkillGap maintains structured skill taxonomy trees for over 31 career paths, including HR Managers, Lawyers, Sales Executives, Healthcare/Pharmacy staff, Accountants, and Operations Managers. The AI compares candidate profiles against industry-standard requirements for each specific role to highlight exact missing skills.',
            },
            {
              q: 'How does the Automatic Skill Test Exemption work?',
              a: 'When a job seeker completes a verified skill assessment (e.g. "React.js" or "Strategic Talent Acquisition") and earns a badge, any future job application on SkillGap automatically bypasses the test phase, saving time for both the applicant and employer.',
            },
            {
              q: 'Can employers sync interview dates with external calendar tools?',
              a: 'Yes! The Employer Interview Calendar features 1-click export links for Google Calendar as well as downloadable standard .ics files compatible with Apple Calendar, Outlook, and mobile calendar apps.',
            },
            {
              q: 'What is the AI JD Quality & Requirement Analyzer?',
              a: 'Employers can paste a job description into our JD Analyzer. The tool evaluates clear expectations vs inflated buzzwords, flags potentially unrealistic AI-generated requirements, and outputs a quality score alongside a structured, higher-converting JD rewrite.',
            },
            {
              q: 'Is there a free trial for learners and employers?',
              a: 'Yes! Job seekers can sign up for the free Career Starter plan, and employers can test job postings and applicant screening with trial access anytime.',
            },
          ].map((item, idx) => (
            <div className="faq-item" key={idx}>
              <div className="faq-question" onClick={() => toggleFaq(idx)}>
                <span>{item.q}</span>
                {openFaq.includes(idx) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
              {openFaq.includes(idx) && <div className="faq-answer">{item.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* CALL TO ACTION BANNER */}
      <div className="cta-banner-wrapper">
        <div className="cta-banner">
          <h2 className="cta-title">READY TO TRANSFORM YOUR CAREER OR HIRING PIPELINE?</h2>
          <p className="hero-subtitle" style={{ marginBottom: '2rem' }}>
            Join thousands of job seekers and innovative employers using SkillGap to bridge skill gaps and connect with precision.
          </p>
          <div className="hero-actions" style={{ marginBottom: 0 }}>
            <button className="btn-glow-primary" onClick={() => navigate(user ? '/dashboard' : '/signup')}>
              Get Started Now <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div>
            <div className="landing-brand" style={{ marginBottom: '0.75rem' }}>
              <div className="landing-brand-text">SKILLGAP</div>
            </div>
            <p className="footer-brand-desc">
              The next-generation AI platform connecting candidates and employers through skill gap diagnostics, real-time market pulse analytics, and verified skill badges.
            </p>
          </div>

          <div>
            <h4 className="footer-col-title">Candidate Product</h4>
            <ul className="footer-links">
              <li><a href="#features">Skill Gap Diagnostic</a></li>
              <li><a href="#ecosystem">Adaptive Learning Paths</a></li>
              <li><a href="#features">Verified Skill Badges</a></li>
              <li><a href="#features">Market Pulse Analytics</a></li>
              <li><a href="#pricing">Candidate Pricing</a></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-col-title">Employer Suite</h4>
            <ul className="footer-links">
              <li><a href="#ecosystem">AI JD Quality Analyzer</a></li>
              <li><a href="#ecosystem">Applicant Rejection Insights</a></li>
              <li><a href="#ecosystem">Interview Calendar Grid</a></li>
              <li><a href="#ecosystem">Talent Search Engine</a></li>
              <li><a href="#pricing">Employer Pricing</a></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-col-title">Platform & Public</h4>
            <ul className="footer-links">
              <li><a href="/verify/sample">Public Credential Verifier</a></li>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="#comparison">Why SkillGap</a></li>
              <li><a href="/login">Sign In</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div>© {new Date().getFullYear()} SkillGap. All rights reserved.</div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
