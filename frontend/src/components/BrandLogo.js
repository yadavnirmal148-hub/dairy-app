import React from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../assets/logo.png';
import '../styles/brand.css';

export default function BrandLogo({
  to = '/',
  size = 'md',
  showText = true,
  showTagline = false,
  variant = 'default',
  centered = false,
}) {
  const markClass = `brand-mark brand-mark--${size}`;
  const brandClass = [
    'brand',
    variant === 'light' ? 'brand--light' : '',
    !showText ? 'brand--icon-only' : '',
    centered ? 'brand--centered' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      <div className={markClass}>
        <img src={logoImg} alt="Gokul Fresh logo" className="brand-logo" width="80" height="80" />
      </div>
      {showText && (
        <div className="brand-text">
          <span className="brand-name">Gokul Fresh</span>
          {showTagline && <span className="brand-tagline">Dairy Delivery</span>}
        </div>
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={brandClass} aria-label="Gokul Fresh home">
        {content}
      </Link>
    );
  }

  return <div className={brandClass}>{content}</div>;
}
