import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);

  const load = () => {
    adminAPI.getAllUsers().then((res) => setUsers(res.data));
  };

  useEffect(() => {
    load();
  }, []);

  const toggleAdmin = async (id, isAdmin) => {
    await adminAPI.setUserAdmin(id, !isAdmin);
    load();
  };

  return (
    <div className="admin-page">
      <h1>Users ({users.length})</h1>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.phone || '—'}</td>
                <td>
                  <span className={`admin-badge ${u.isAdmin ? 'admin-badge--paid' : 'admin-badge--pending'}`}>
                    {u.isAdmin ? 'Admin' : 'Customer'}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="admin-btn-sm admin-btn-primary"
                    onClick={() => toggleAdmin(u._id, u.isAdmin)}
                  >
                    {u.isAdmin ? 'Remove Admin' : 'Make Admin'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
