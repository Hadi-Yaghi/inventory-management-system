import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import api from '../api/axios';
import { Lock, User, Mail, Eye, EyeOff, Store, Loader2, ArrowRight, Check, AlertCircle } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '', // Maps to Full Name / Username constraint
    email: '',
    password: '',
    role: 'EMPLOYEE',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ username: '', email: '', password: '', confirmPassword: '' });
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
        { theme: 'outline', size: 'large', text: 'signup_with', width: 360 }
      );
    }
  }, [loginWithGoogle]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Dynamic Password Strength Calculations
  const pwRules = useMemo(() => {
    const pw = formData.password;
    return {
      length: pw.length >= 8,
      capital: /[A-Z]/.test(pw),
      number: /[0-9]/.test(pw),
      special: /[^A-Za-z0-9]/.test(pw)
    };
  }, [formData.password]);

  const passwordStrengthScore = useMemo(() => {
    let score = 0;
    if (pwRules.length) score += 25;
    if (pwRules.capital) score += 25;
    if (pwRules.number) score += 25;
    if (pwRules.special) score += 25;
    return score;
  }, [pwRules]);

  const strengthDetails = useMemo(() => {
    const score = passwordStrengthScore;
    if (score === 0) return { label: 'None', color: 'bg-slate-800', text: 'text-slate-500' };
    if (score <= 25) return { label: 'Weak', color: 'bg-red-500', text: 'text-red-400' };
    if (score <= 50) return { label: 'Fair', color: 'bg-amber-500', text: 'text-amber-400' };
    if (score <= 75) return { label: 'Good', color: 'bg-blue-500', text: 'text-blue-400' };
    return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-400' };
  }, [passwordStrengthScore]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({ username: '', email: '', password: '', confirmPassword: '' });

    let hasError = false;
    const errors = { username: '', email: '', password: '', confirmPassword: '' };

    if (!formData.username.trim()) {
      errors.username = 'Full Name / Username is required';
      hasError = true;
    }
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
      hasError = true;
    }
    if (!formData.password) {
      errors.password = 'Password is required';
      hasError = true;
    } else if (passwordStrengthScore < 50) {
      errors.password = 'Password is too weak';
      hasError = true;
    }
    if (formData.password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      hasError = true;
    }
    if (!termsAccepted) {
      setError('You must accept the Terms and Conditions to proceed.');
      return;
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
        setSuccess('Account created successfully! Redirecting to login page...');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center bg-slate-950 overflow-hidden font-sans p-4">
      {/* Animated blob backgrounds */}
      <div className="absolute top-1/4 -left-12 w-72 h-72 rounded-full bg-brand-600/20 blur-3xl animate-blob" />
      <div className="absolute bottom-1/4 -right-12 w-96 h-96 rounded-full bg-indigo-500/25 blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl animate-blob animation-delay-4000" />
      
      {/* Subtle gird pattern background overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35" />

      {/* Main Container Card */}
      <div className="w-full max-w-lg bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl relative z-10 flex flex-col space-y-6">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/10 mb-1">
            <Store className="h-6 w-6" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white font-display">Create an Account</h1>
          <p className="text-xs text-slate-400">Register a new profile credentials to access the ERP platform</p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-900/60 text-red-400 text-xs font-semibold rounded-lg text-center flex items-center justify-center gap-1.5 animate-fade-in">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 text-xs font-semibold rounded-lg text-center flex items-center justify-center gap-1.5 animate-fade-in">
            <Check className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Full Name Input */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Full Name / Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-500" />
                </span>
                <input
                  type="text"
                  name="username"
                  autoFocus
                  required
                  disabled={loading}
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter full name"
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

            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-500" />
                </span>
                <input
                  type="email"
                  name="email"
                  required
                  disabled={loading}
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  className={`w-full text-xs pl-10 pr-3 py-2.5 bg-slate-950 hover:bg-slate-950/80 focus:bg-slate-950 text-white rounded-lg border focus:outline-none transition-all ${
                    fieldErrors.email 
                      ? 'border-red-500/70 focus:ring-1 focus:ring-red-500' 
                      : 'border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-red-400 text-[10px] font-semibold">{fieldErrors.email}</p>
              )}
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-500" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  disabled={loading}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create password"
                  className={`w-full text-xs pl-10 pr-10 py-2.5 bg-slate-950 hover:bg-slate-950/80 focus:bg-slate-950 text-white rounded-lg border focus:outline-none transition-all ${
                    fieldErrors.password 
                      ? 'border-red-500/70 focus:ring-1 focus:ring-red-500' 
                      : 'border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-350"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-red-400 text-[10px] font-semibold">{fieldErrors.password}</p>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-500" />
                </span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type password"
                  className={`w-full text-xs pl-10 pr-10 py-2.5 bg-slate-950 hover:bg-slate-950/80 focus:bg-slate-950 text-white rounded-lg border focus:outline-none transition-all ${
                    fieldErrors.confirmPassword 
                      ? 'border-red-500/70 focus:ring-1 focus:ring-red-500' 
                      : 'border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-350"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-red-400 text-[10px] font-semibold">{fieldErrors.confirmPassword}</p>
              )}
            </div>

          </div>

          {/* Password strength visualizer and requirement checklist */}
          {formData.password && (
            <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800 space-y-3 animate-fade-in">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Strength: <span className={strengthDetails.text}>{strengthDetails.label}</span></span>
                <span className="text-slate-500 font-bold">{passwordStrengthScore}%</span>
              </div>
              
              {/* Strength bar gauge */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-300 ${strengthDetails.color}`}
                  style={{ width: `${passwordStrengthScore}%` }} 
                />
              </div>

              {/* Dynamic checklist requirements */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className={`flex items-center gap-1.5 ${pwRules.length ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <span className="shrink-0">●</span>
                  <span>At least 8 chars</span>
                </div>
                <div className={`flex items-center gap-1.5 ${pwRules.capital ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <span className="shrink-0">●</span>
                  <span>Capital letter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${pwRules.number ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <span className="shrink-0">●</span>
                  <span>A number (0-9)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${pwRules.special ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <span className="shrink-0">●</span>
                  <span>Special char</span>
                </div>
              </div>
            </div>
          )}

          {/* Role Dropdown Selector */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assigned Security Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
              className="w-full text-xs border border-slate-800 rounded-lg p-2.5 bg-slate-950 hover:bg-slate-950/80 text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer font-semibold"
            >
              <option value="EMPLOYEE">Employee (Shelf Counting & Order Entry)</option>
              <option value="MANAGER">Manager (Store Inventory Control)</option>
              <option value="ADMIN">Admin (Full System Configurations)</option>
            </select>
          </div>

          {/* Terms & Conditions Check */}
          <div className="flex items-center justify-between py-1 text-xs">
            <label className="flex items-center space-x-2 text-slate-400 cursor-pointer select-none">
              <input 
                type="checkbox"
                required
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="rounded border-slate-800 text-brand-600 focus:ring-brand-500 bg-slate-950 h-3.5 w-3.5 cursor-pointer" 
              />
              <span className="text-[11px] text-slate-400 font-medium leading-tight">
                I agree to the Terms of Service and Privacy Policy
              </span>
            </label>
          </div>

          {/* Create Button */}
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
                <span>Creating ERP workspace profile...</span>
              </>
            ) : (
              <>
                <span>Create account</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center py-1">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">or sign up with</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        {/* Google OAuth Button Container */}
        <div className="w-full flex justify-center select-none">
          <div id="google-signup-button" className="w-full max-w-[360px] flex justify-center"></div>
        </div>

        {/* Login Link Footer */}
        <div className="text-center text-xs text-slate-400 font-medium pt-1">
          Already registered?{' '}
          <Link to="/login" className="text-brand-500 hover:text-brand-400 font-bold transition-colors">
            Sign in
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Signup;
