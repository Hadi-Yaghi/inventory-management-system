import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import { Lock, User, Eye, EyeOff, Store, Loader2, ArrowRight } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
        { theme: 'outline', size: 'large', text: 'continue_with', width: 360 }
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
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 401) {
        setError('Invalid username or password');
      } else if (!err.response) {
        setError('Cannot connect to the backend server. Please verify your VITE_API_BASE_URL environment variable on your deployed site.');
      } else {
        setError('An error occurred during login. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center bg-slate-950 overflow-hidden font-sans p-4">
      {/* Background design elements (Floating gradient blobs) */}
      <div className="absolute top-1/4 -left-12 w-72 h-72 rounded-full bg-brand-600/20 blur-3xl animate-blob" />
      <div className="absolute bottom-1/4 -right-12 w-96 h-96 rounded-full bg-indigo-500/25 blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl animate-blob animation-delay-4000" />
      
      {/* Subtle gird pattern background overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35" />

      {/* Main card */}
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10 flex flex-col items-stretch space-y-6">
        
        {/* Company Identity Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/10 mb-2">
            <Store className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">Welcome Back</h1>
          <p className="text-xs text-slate-400">Sign in to access your Aegis ERP account</p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-900/60 text-red-400 text-xs font-semibold rounded-lg text-center animate-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-slate-500" />
              </span>
              <input
                type="text"
                autoFocus
                required
                disabled={loading}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className={`w-full text-xs pl-10 pr-3 py-2.5 bg-slate-950 hover:bg-slate-950/80 focus:bg-slate-950 text-white rounded-lg border focus:outline-none transition-all ${
                  fieldErrors.username 
                    ? 'border-red-500/70 focus:ring-1 focus:ring-red-500' 
                    : 'border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
                }`}
              />
            </div>
            {fieldErrors.username && (
              <p className="text-red-400 text-[10px] font-semibold">{fieldErrors.username}</p>
            )}
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
              <button
                type="button"
                onClick={() => {}}
                className="text-[10px] font-bold text-brand-500 hover:text-brand-400 transition-colors"
              >
                Forgot?
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-500" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className={`w-full text-xs pl-10 pr-10 py-2.5 bg-slate-950 hover:bg-slate-950/80 focus:bg-slate-950 text-white rounded-lg border focus:outline-none transition-all ${
                  fieldErrors.password 
                    ? 'border-red-500/70 focus:ring-1 focus:ring-red-500' 
                    : 'border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-350 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-red-400 text-[10px] font-semibold">{fieldErrors.password}</p>
            )}
          </div>

          {/* Remember me option */}
          <div className="flex items-center justify-between py-1 text-xs">
            <label className="flex items-center space-x-2 text-slate-400 cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-800 text-brand-600 focus:ring-brand-500 bg-slate-950 h-3.5 w-3.5 cursor-pointer" 
              />
              <span className="text-[11px] font-medium text-slate-400">Remember this device</span>
            </label>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold text-white shadow-md transition-all duration-200 ${
              loading 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                : 'bg-brand-600 hover:bg-brand-700 hover:scale-[1.01] active:scale-[0.99]'
            } flex justify-center items-center gap-2 focus:outline-none`}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                <span>Verifying credentials...</span>
              </>
            ) : (
              <>
                <span>Sign in</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">or continue with</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        {/* Google OAuth Button Container */}
        <div className="w-full flex justify-center select-none">
          <div id="google-signin-button" className="w-full max-w-[360px] flex justify-center"></div>
        </div>

        {/* Signup Link Footer */}
        <div className="text-center text-xs text-slate-400 font-medium pt-2">
          New to the platform?{' '}
          <Link to="/signup" className="text-brand-500 hover:text-brand-400 font-bold transition-colors">
            Register Workspace
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Login;
