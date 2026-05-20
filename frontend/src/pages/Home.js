import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import BrandLogo from '../components/BrandLogo';
import homeBg from '../assets/home.png';
import '../styles/Home.css';

export default function Home() {
  return (
    <div className="home">
      <nav className="home-nav">
        <BrandLogo to="/" size="md" showTagline />
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/products">Products</Link></li>
          <li><Link to="/register">Subscribe</Link></li>
        </ul>
        <div className="auth-buttons">
          <Link to="/login" className="btn btn-ghost">Login</Link>
          <Link to="/register" className="btn btn-accent">Get Started</Link>
        </div>
      </nav>

      <section
        className="hero"
        style={{
          backgroundImage: `linear-gradient(105deg, rgba(27,94,52,0.88) 0%, rgba(45,143,78,0.75) 45%, rgba(0,0,0,0.35) 100%), url(${homeBg})`,
        }}
      >
        <div className="hero-text">
          <span className="hero-badge">🌅 Delivery by 6 AM</span>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            Pure milk. Zero preservatives.
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            Farm-fresh dairy subscription for Jaipur — milk, paneer, dahi & more.
          </motion.p>
          <motion.div className="hero-buttons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            <Link to="/register" className="btn btn-accent">Start free trial</Link>
            <Link to="/products" className="btn btn-outline-light">Browse products</Link>
          </motion.div>
        </div>
      </section>

      <section className="trust-strip">
        <div>🥛 100% natural</div>
        <div>🚚 Free delivery</div>
        <div>📍 Jaipur zones</div>
        <div>⏰ Morning slot</div>
      </section>

      <section className="features">
        <motion.div className="feature premium-card" whileHover={{ y: -6 }}>
          <span className="icon">🚚</span>
          <h3>Daily delivery</h3>
          <p>Fresh at your door before breakfast</p>
        </motion.div>
        <motion.div className="feature premium-card" whileHover={{ y: -6 }}>
          <span className="icon">✅</span>
          <h3>Lab tested</h3>
          <p>Quality you can trust every day</p>
        </motion.div>
        <motion.div className="feature premium-card" whileHover={{ y: -6 }}>
          <span className="icon">🌿</span>
          <h3>Farm to home</h3>
          <p>Direct from trusted dairies</p>
        </motion.div>
      </section>

      <section className="bottom-info">
        <div className="info-box premium-card">Farm Fresh — Direct from farms</div>
        <div className="info-box premium-card">No Preservatives — 100% Natural</div>
        <div className="info-box premium-card">Easy pause & skip — Manage in app</div>
      </section>
    </div>
  );
}
