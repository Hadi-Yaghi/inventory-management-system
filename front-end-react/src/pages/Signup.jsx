import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import api from '../api/axios';
import { Lock, User, Mail, Eye, EyeOff, Package, Loader2 } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ username: '', email: '', password: '' });
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleCredentialResponse = async (response) => {
    const idToken = response.credential;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await loginWithGoogle(idToken);
      setSuccess('Signed in with Google successfully!');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '179397822277-o16hsadadccqiec97i7p8eoop5eqdtri.apps.googleusercontent.com',
        callback: handleGoogleCredentialResponse,
      });
      window.google.accounts.id.renderButton(
        document.getElementById('google-signup-button'),
        { theme: 'outline', size: 'large', text: 'signup_with', width: 380 }
      );
    }
  }, [loginWithGoogle]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({ username: '', email: '', password: '' });

    let hasError = false;
    const errors = { username: '', email: '', password: '' };

    if (!formData.username.trim()) {
      errors.username = 'Username is required';
      hasError = true;
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
      hasError = true;
    }
    if (!formData.password) {
      errors.password = 'Password is required';
      hasError = true;
    }

    if (hasError) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/register', formData);
      if (response.data.message?.includes('already taken')) {
        setError(response.data.message);
      } else {
        setSuccess('Account created successfully! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 w-full max-w-md transition-all duration-300 hover:shadow-2xl">
        
        {/* Brand/Logo Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center space-x-2 bg-indigo-50 px-4 py-2 rounded-2xl mb-4">
            <Package className="h-6 w-6 text-indigo-600 animate-bounce" />
            <span className="text-xl font-bold text-indigo-900 tracking-tight">InventorySystem</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Create an Account</h1>
          <p className="text-slate-500 text-sm mt-1">Get started with your manager platform</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center font-medium animate-pulse">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm text-center font-medium">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={loading}
                className={`pl-11 w-full p-2.5 border ${
                  fieldErrors.username ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-indigo-100'
                } rounded-xl focus:ring-4 outline-none transition duration-200`}
                placeholder="Choose a username"
              />
            </div>
            {fieldErrors.username && (
              <p className="text-red-500 text-xs mt-1.5 font-medium">{fieldErrors.username}</p>
            )}
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                className={`pl-11 w-full p-2.5 border ${
                  fieldErrors.email ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-indigo-100'
                } rounded-xl focus:ring-4 outline-none transition duration-200`}
                placeholder="your.email@example.com"
              />
            </div>
            {fieldErrors.email && (
              <p className="text-red-500 text-xs mt-1.5 font-medium">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                className={`pl-11 pr-10 w-full p-2.5 border ${
                  fieldErrors.password ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-indigo-100'
                } rounded-xl focus:ring-4 outline-none transition duration-200`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-indigo-600 transition"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-red-500 text-xs mt-1.5 font-medium">{fieldErrors.password}</p>
            )}
          </div>

          {/* Role Dropdown Selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Assigned Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
              className="w-full p-2.5 border border-slate-300 rounded-xl outline-none bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition duration-200"
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-xl text-white font-semibold shadow-md transition-all duration-200 ${
              loading 
                ? 'bg-indigo-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg active:scale-98'
            } flex justify-center items-center space-x-2`}
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              <span>Sign up</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-4 text-slate-400 font-medium">Or continue with</span>
          </div>
        </div>

        {/* Google OAuth Button Container */}
        <div className="w-full flex justify-center">
          <div id="google-signup-button" className="w-full max-w-[380px]"></div>
        </div>

        {/* Login Link Footer */}
        <div className="mt-8 text-center text-sm text-slate-500 font-medium">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-bold transition">
            Sign in
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Signup;
