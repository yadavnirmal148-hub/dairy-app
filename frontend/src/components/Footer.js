import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from './BrandLogo';
import '../styles/Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section footer-brand">
          <BrandLogo to="/" size="md" showTagline variant="light" />
          <p className="footer-about">
            100% pure farm-fresh dairy — delivered to your doorstep in Jaipur every morning.
          </p>
        </div>

        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/products">Products</Link></li>
            <li><Link to="/orders">Orders</Link></li>
            <li><Link to="/dashboard">Shop</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Contact</h3>
          <p>gokulfreshmilk727@gmail.com</p>
          <p>Jaipur, Rajasthan</p>
        </div>

        <div className="footer-section">
          <h3>Delivery</h3>
          <p>Morning slot by 6 AM</p>
          <p>Free delivery in Jaipur zones</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Gokul Fresh. All rights reserved.</p>
      </div>
    </footer>
  );
}
