import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import './styles/admin.css';

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <BrandLogo to="/admin" size="sm" showTagline variant="light" />
        </div>
        <ul className="admin-nav">
          <li><NavLink to="/admin" end>Dashboard</NavLink></li>
          <li><NavLink to="/admin/orders">Orders</NavLink></li>
          <li><NavLink to="/admin/products">Products</NavLink></li>
          <li><NavLink to="/admin/users">Users</NavLink></li>
          <li><NavLink to="/admin/locations">Locations</NavLink></li>
          <li><Link to="/dashboard">← Store</Link></li>
        </ul>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
