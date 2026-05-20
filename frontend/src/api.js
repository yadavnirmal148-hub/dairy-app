import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Axios instance
const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 90000,
});

// ✅ Auto-attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── AUTH ────────────────────────────────────────────────
export const authAPI = {
  sendOTP: (email) => api.post('/auth/send-otp', { email: email.toLowerCase() }),
  register: (data) =>
    api.post('/auth/register', {
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      password: data.password,
      otp: data.otp,
    }),
  login: (email, password) =>
    api.post('/auth/login', { email: email.toLowerCase(), password }),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// ── PRODUCTS ────────────────────────────────────────────
export const productAPI = {
  getAll: () => api.get('/products'),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

// ── CART ────────────────────────────────────────────────
export const cartAPI = {
  getCart: () => api.get('/cart'),
  addItem: (productId, quantity) =>
    api.post('/cart/add', { productId, quantity }),
  updateItem: (productId, quantity) =>
    api.put('/cart/update', { productId, quantity }),
  removeItem: (productId) => api.delete(`/cart/remove/${productId}`),
  clearCart: () => api.delete('/cart/clear'),
};

// ── ORDERS ──────────────────────────────────────────────
export const orderAPI = {
  create: (data) => api.post('/orders', data),   // ✅ direct payload भेजो
  getAll: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, orderStatus, paymentStatus) =>
    api.put(`/orders/${id}/status`, { orderStatus, paymentStatus }),
};

// ── PAYMENTS (UPI + Razorpay) ───────────────────────────
export const paymentAPI = {
  getStatus: () => api.get('/payments/status'),
  // UPI Flow
  initiate: (amount) => api.post('/payments/initiate', { amount }),
  confirm: (orderId, txnRef) =>
    api.post('/payments/confirm', { orderId, txnRef }),

  // Razorpay Flow
  createOrder: (amount) => api.post('/payments/create-order', { amount }),
  confirmRazorpay: (orderId, txnRef) =>
    api.post('/payments/confirm', { orderId, txnRef }),
};

// ── SUBSCRIPTIONS ───────────────────────────────────────
export const subscriptionAPI = {
  create: (products, frequency, startDate) =>
    api.post('/subscriptions', { products, frequency, startDate }),
  getAll: () => api.get('/subscriptions'),
  cancel: (id) => api.put(`/subscriptions/${id}/cancel`),
};

// ── ADMIN ───────────────────────────────────────────────
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getAllOrders: () => api.get('/admin/orders'),
  verifyOrder: (id) => api.put(`/admin/orders/${id}/verify`),
  updateOrderStatus: (id, orderStatus) =>
    api.put(`/admin/orders/${id}/status`, { orderStatus }),
  deleteOrder: (id) => api.delete(`/admin/orders/${id}`),
  getAllProducts: () => api.get('/admin/products'),
  addProduct: (data) => api.post('/admin/products', data),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  getAllUsers: () => api.get('/admin/users'),
  setUserAdmin: (id, isAdmin) => api.put(`/admin/users/${id}/admin`, { isAdmin }),
  getLocations: () => api.get('/admin/locations'),
};

// ── ERROR HANDLER ───────────────────────────────────────
export const handleAPIError = (error) => {
  if (error.response) {
    const data = error.response.data;
    let message = data?.message;
    if (!message && typeof data === 'string') {
      message = data.includes('Not Found')
        ? 'API URL galat hai. Netlify mein REACT_APP_API_URL ke end mein /api hona chahiye.'
        : data.slice(0, 100);
    }
    if (!message && error.response.status === 401) {
      message = 'Invalid email or password';
    }
    if (!message && error.response.status === 404) {
      message =
        'API not found. Netlify env: REACT_APP_API_URL = https://dairy-app-lahk.onrender.com/api';
    }
    return {
      status: error.response.status,
      message: message || `Server error (${error.response.status})`,
    };
  }
  if (error.request) {
    return {
      status: 0,
      message: 'No response from server. Check your connection.',
    };
  }
  return { status: 0, message: error.message };
};

export default api;
 