import React, { createContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await authAPI.getProfile();
      setUser(response.data);

      // ✅ isAdmin flag को localStorage में भी save करो
      localStorage.setItem('isAdmin', response.data.isAdmin ? 'true' : 'false');
    } catch (err) {
      console.error('Error fetching user:', err);
      localStorage.removeItem('token');
      localStorage.removeItem('isAdmin');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await authAPI.login(email.toLowerCase(), password);
    setToken(response.data.token);
    setUser(response.data.user);

    // ✅ token और isAdmin दोनों save करो
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('isAdmin', response.data.user.isAdmin ? 'true' : 'false');

    return response.data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin'); // ✅ logout पर साफ करो
  };

  const register = async (name, email, password, phone) => {
    const response = await authAPI.register({
      name,
      email: email.toLowerCase(),
      password,
      phone,
    });
    return response.data;
  };

  const updateProfile = async (profileData) => {
    const response = await authAPI.updateProfile(profileData);
    setUser(response.data);
    return response.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAdmin: !!user?.isAdmin,
        login,
        logout,
        register,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}



