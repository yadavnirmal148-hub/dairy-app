import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../api';

const emptyProduct = {
  name: '',
  description: '',
  price: '',
  image: '',
  category: 'Dairy',
  stock: '',
  unit: '1L',
  isActive: true,
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);

  const load = () => {
    adminAPI.getAllProducts().then((res) => setProducts(res.data));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
      isActive: form.isActive !== false,
    };
    if (editingId) {
      await adminAPI.updateProduct(editingId, payload);
    } else {
      await adminAPI.addProduct(payload);
    }
    setForm(emptyProduct);
    setEditingId(null);
    load();
  };

  const edit = (p) => {
    setEditingId(p._id);
    setForm({
      name: p.name,
      description: p.description || '',
      price: p.price,
      image: p.image || '',
      category: p.category || 'Dairy',
      stock: p.stock,
      unit: p.unit || '1L',
      isActive: p.isActive !== false,
    });
  };

  const remove = async (id) => {
    if (window.confirm('Delete this product?')) {
      await adminAPI.deleteProduct(id);
      load();
    }
  };

  return (
    <div className="admin-page">
      <h1>Products</h1>

      <form className="admin-form" onSubmit={handleSubmit}>
        <h3>{editingId ? 'Edit Product' : 'Add Product'}</h3>
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
        />
        <input
          type="number"
          placeholder="Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
        />
        <input
          placeholder="Image URL"
          value={form.image}
          onChange={(e) => setForm({ ...form, image: e.target.value })}
        />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {['Milk', 'Ghee', 'Curd', 'Paneer', 'Butter', 'Dairy'].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Stock"
          value={form.stock}
          onChange={(e) => setForm({ ...form, stock: e.target.value })}
        />
        <input
          placeholder="Unit (e.g. 1L)"
          value={form.unit}
          onChange={(e) => setForm({ ...form, unit: e.target.value })}
        />
        <label>
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          {' '}Active on store
        </label>
        <div className="admin-actions">
          <button type="submit" className="btn btn-primary">
            {editingId ? 'Update' : 'Add'} Product
          </button>
          {editingId && (
            <button type="button" className="btn btn-secondary" onClick={() => { setEditingId(null); setForm(emptyProduct); }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Category</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id}>
                <td>{p.name}</td>
                <td>₹{p.price}</td>
                <td>{p.stock}</td>
                <td>{p.category}</td>
                <td className="admin-actions">
                  <button type="button" className="admin-btn-sm admin-btn-primary" onClick={() => edit(p)}>Edit</button>
                  <button type="button" className="admin-btn-sm admin-btn-danger" onClick={() => remove(p._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
