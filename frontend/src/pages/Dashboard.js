import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { productAPI, cartAPI, handleAPIError } from "../api";
import { AuthContext } from "../context/AuthContext";
import BrandLogo from "../components/BrandLogo";
import hero from "../assets/hero.png";
import "../styles/dashboard.css";

function Dashboard() {
  const { logout, isAdmin } = useContext(AuthContext);
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [error, setError] = useState("");

  // ✅ Fetch Products
  useEffect(() => {
    productAPI.getAll()
      .then(res => setProducts(res.data))
      .catch(err => {
        const errorInfo = handleAPIError(err);
        setError(errorInfo.message);
      });
  }, []);

  // ✅ Fetch Cart
  useEffect(() => {
    cartAPI.getCart()
      .then(res => setCart(res.data.items || []))
      .catch(() => console.log("Cart error"));
  }, []);

  // ✅ Add to Cart
  const addToCart = async (productId) => {
    try {
      await cartAPI.addItem(productId, 1);
      alert("✅ Added to cart!");
    } catch (err) {
      const errorInfo = handleAPIError(err);
      alert("❌ " + errorInfo.message);
    }
  };

  // ✅ Subscribe Handler
  const handleSubscribe = () => {
    const email = document.getElementById("subscribeEmail").value;
    if (email) {
      alert(`✅ Subscribed with ${email}`);
      // 👉 यहां तुम backend API call कर सकते हो
      // newsletterAPI.subscribe(email)
    } else {
      alert("❌ Please enter a valid email");
    }
  };

  return (
    <div className="dashboard">
      {/* Navbar */}
      <nav className="navbar">
        <BrandLogo to="/" size="md" showTagline variant="light" />
        <div className="navLinks">
          <Link to="/">Home</Link>
          <Link to="/products">Products</Link>
          <Link to="/cart">Cart</Link>
          <Link to="/orders">Orders</Link>
          <Link to="/profile">Profile</Link>
          {isAdmin && <Link to="/admin">Admin</Link>}
        </div>
        <div className="rightNav">
          <Link to="/cart">🛒 <span className="cartCount">{cart.length}</span></Link>
          <button
            type="button"
            className="logout"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Offer Slider */}
      <section className="offerSlider">
        <div className="offerTrack">
          <span>🔥 20% off on A2 Cow Milk Subscription</span>
          <span>🥛 Free Delivery on orders above ₹500</span>
          <span>🧀 Paneer Special – ₹280/kg only</span>
          <span>🍶 Dahi Combo Pack – Buy 2 Get 1 Free</span>
        </div>
      </section>

      {/* Hero */}
      <section
        className="hero dashboard-hero"
        style={{
          backgroundImage: `linear-gradient(105deg, rgba(27,94,52,0.9), rgba(45,143,78,0.7)), url(${hero})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="heroText">
          <h1>Order Preservative-Free Dairy Products</h1>
          <p>Purity you can trust, freshness you can feel</p>
          <Link to="/products" className="btnGreen" style={{ textDecoration: 'none' }}>Order Now</Link>
          <Link to="/cart" className="btnYellow" style={{ textDecoration: 'none' }}>View Cart</Link>
        </div>
      </section>

      {/* Products */}
      <section className="products">
        <h2>Our Products</h2>
        {error && <p className="error">❌ {error}</p>}
        <div className="grid">
          {products.length > 0 ? (
            products.map((p) => (
              <div key={p._id} className="card">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="img" />
                ) : (
                  <div className="img product-image-placeholder">{p.name}</div>
                )}
                <h3>{p.name}</h3>
                <p>{p.description}</p>
                <div className="meta">
                  <span>{p.category}</span> | <span>{p.unit}</span>
                </div>
                <p className="price">₹ {p.price}</p>
                <button className="btnGreen" onClick={() => addToCart(p._id)}>Add to Cart</button>
                {p.stock === 0 && <div className="out-of-stock">Out of Stock</div>}
              </div>
            ))
          ) : (
            <p>No products available</p>
          )}
        </div>
      </section>

      <section className="video-section">
        <h2>Our Story 🥛</h2>
        <p>From trusted Jaipur dairies to your doorstep — fresh every morning.</p>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter">
        <h2>Stay Updated</h2>
        <p>Subscribe to get latest offers and updates.</p>
        <input type="email" placeholder="Enter your email" id="subscribeEmail" />
        <button className="btnGreen" onClick={handleSubscribe}>Subscribe</button>
      </section>

      {/* Gallery Section */}
      <section className="gallery">
        <h2>Why Gokul Fresh?</h2>
        <div className="galleryGrid">
          <div className="info-box">🐄 A2 & buffalo milk</div>
          <div className="info-box">🚚 Morning delivery</div>
          <div className="info-box">✅ Lab tested quality</div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
