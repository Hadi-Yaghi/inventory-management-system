import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import { Lock, User, Eye, EyeOff, Package, Loader2 } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleCredentialResponse = async (response) => {
    const idToken = response.credential;
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle(idToken);
      navigate('/');
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
        document.getElementById('google-signin-button'),
        { theme: 'outline', size: 'large', text: 'continue_with', width: 380 }
      );
    }
  }, [loginWithGoogle]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({ username: '', password: '' });

    let hasError = false;
    const errors = { username: '', password: '' };
    
    if (!username.trim()) {
      errors.username = 'Username is required';
      hasError = true;
    }
    if (!password) {
      errors.password = 'Password is required';
      hasError = true;
    }

    if (hasError) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Invalid username or password');
      } else {
        setError('An error occurred during login. Please try again.');
      }
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
          <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to manage your inventory</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center font-medium animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                required
                className={`pl-11 w-full p-2.5 border ${
                  fieldErrors.username ? 'border-red-500 focus:ring-red-200 focus:border-red-500' : 'border-slate-300 focus:ring-indigo-100 focus:border-indigo-500'
                } rounded-xl focus:ring-4 outline-none transition duration-200`}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                aria-invalid={fieldErrors.username ? "true" : "false"}
              />
            </div>
            {fieldErrors.username && (
              <p className="text-red-500 text-xs mt-1.5 font-medium">{fieldErrors.username}</p>
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
                required
                className={`pl-11 pr-10 w-full p-2.5 border ${
                  fieldErrors.password ? 'border-red-500 focus:ring-red-200 focus:border-red-500' : 'border-slate-300 focus:ring-indigo-100 focus:border-indigo-500'
                } rounded-xl focus:ring-4 outline-none transition duration-200`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                aria-invalid={fieldErrors.password ? "true" : "false"}
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
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign in</span>
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
          <div id="google-signin-button" className="w-full max-w-[380px]"></div>
        </div>

        {/* Signup Link Footer */}
        <div className="mt-8 text-center text-sm text-slate-500 font-medium">
          Don't have an account?{' '}
          <Link to="/signup" className="text-indigo-600 hover:text-indigo-800 font-bold transition">
            Sign up
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Login;
