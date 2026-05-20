import React, { useState, useEffect, useContext } from 'react';
import { productAPI, handleAPIError } from '../api';
import { CartContext } from '../context/CartContext';
import '../styles/Product.css';
import { useNavigate } from "react-router-dom";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addToCart } = useContext(CartContext);
  const [addingToCart, setAddingToCart] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getAll();
      setProducts(response.data);
    } catch (err) {
      const errorInfo = handleAPIError(err);
      setError(errorInfo.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      setAddingToCart(productId);
      await addToCart(productId, 1);
      alert('✅ Added to cart!');
    } catch (err) {
      const errorInfo = handleAPIError(err);
      alert('❌ ' + errorInfo.message);
    } finally {
      setAddingToCart(null);
    }
  };

  if (loading) return <div className="loading">⏳ Loading products...</div>;
  if (error) return <div className="error">❌ {error}</div>;

  return (
    <div className="products-container">
      <h1>🛍️ Our Products</h1>
      <div className="products-grid">
        {products.map((product) => (
          <div key={product._id} className="product-card">
            <img
              src={product.image}
              alt={product.name}
              className="product-image"
            />
            <h3>{product.name}</h3>
            <p className="description">{product.description}</p>
            <div className="product-meta">
              <span className="category">{product.category}</span>
              <span className="unit">{product.unit}</span>
            </div>
            <div className="product-footer">
              <div className="price">₹{product.price}</div>
              <button
                onClick={() => handleAddToCart(product._id)}
                disabled={addingToCart === product._id || product.stock === 0}
                className="add-btn"
              >
                {addingToCart === product._id ? '⏳' : '🛒'}
              </button>
            </div>
            {product.stock === 0 && <div className="out-of-stock">Out of Stock</div>}
          </div>
        ))}
      </div>
     

<button 
  className="back-btn" 
  onClick={() => navigate(-1)}
>
  ← Back
</button>

    </div>
  );
}