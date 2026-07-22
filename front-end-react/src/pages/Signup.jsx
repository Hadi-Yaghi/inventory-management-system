import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import api from '../api/axios';
import { Lock, User, Mail, Eye, EyeOff, Store, Loader2, Check, AlertCircle, Building2, Ticket } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithGoogle } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const urlToken = searchParams.get('token') || '';

  const [signupMode, setSignupMode] = useState(urlToken ? 'invitation' : 'new_org');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
    organizationName: '',
    invitationToken: urlToken,
  });
  
  const [invitedOrgDetails, setInvitedOrgDetails] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ username: '', email: '', password: '', confirmPassword: '', organizationName: '', invitationToken: '' });
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (urlToken) {
      setSignupMode('invitation');
      setFormData((prev) => ({ ...prev, invitationToken: urlToken }));
      fetchInvitationDetails(urlToken);
    }
  }, [urlToken]);

  const fetchInvitationDetails = async (token) => {
    if (!token) return;
    try {
      const res = await api.get(`/organizations/public/invitation/${token}`);
      setInvitedOrgDetails(res.data);
      if (res.data.email) {
        setFormData((prev) => ({ ...prev, email: res.data.email, role: res.data.role }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired invitation token');
    }
  };

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
    setFieldErrors({ username: '', email: '', password: '', confirmPassword: '', organizationName: '', invitationToken: '' });

    let hasError = false;
    const errors = { username: '', email: '', password: '', confirmPassword: '', organizationName: '', invitationToken: '' };

    if (!formData.username.trim()) {
      errors.username = 'Username is required';
      hasError = true;
    }
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
      hasError = true;
    }

    if (signupMode === 'new_org' && !formData.organizationName.trim()) {
      errors.organizationName = 'Organization name is required';
      hasError = true;
    }

    if (signupMode === 'invitation' && !formData.invitationToken.trim()) {
      errors.invitationToken = 'Invitation token is required';
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
      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        organizationName: signupMode === 'new_org' ? formData.organizationName.trim() : undefined,
        invitationToken: signupMode === 'invitation' ? formData.invitationToken.trim() : undefined,
      };

      const response = await api.post('/auth/register', payload);
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
    <div className="min-h-screen w-full relative flex items-center justify-center bg-slate-950 font-sans p-4 overflow-x-hidden">
      <div className="absolute top-1/4 -left-12 w-72 h-72 rounded-full bg-brand-600/20 blur-3xl animate-blob" />
      <div className="absolute bottom-1/4 -right-12 w-96 h-96 rounded-full bg-indigo-500/25 blur-3xl animate-blob animation-delay-2000" />

      <div className="w-full max-w-lg bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl relative z-10 flex flex-col space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md mb-1">
            <Store className="h-6 w-6" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white font-display">Create SaaS Account</h1>
          <p className="text-xs text-slate-400">Register your organization or join an existing workspace</p>
        </div>

        {/* Signup Mode Toggle */}
        <div className="grid grid-cols-2 p-1 bg-slate-950/70 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => { setSignupMode('new_org'); setError(''); }}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              signupMode === 'new_org' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>New Organization</span>
          </button>
          <button
            type="button"
            onClick={() => { setSignupMode('invitation'); setError(''); }}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              signupMode === 'invitation' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Ticket className="h-3.5 w-3.5" />
            <span>Have Invitation</span>
          </button>
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
          {signupMode === 'new_org' ? (
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Organization Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Building2 className="h-4 w-4 text-slate-500" />
                </span>
                <input
                  type="text"
                  name="organizationName"
                  placeholder="e.g. Acme Logistics Corp"
                  disabled={loading}
                  value={formData.organizationName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                />
              </div>
              {fieldErrors.organizationName && <p className="text-[11px] text-red-400 font-medium">{fieldErrors.organizationName}</p>}
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Invitation Code / Token</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Ticket className="h-4 w-4 text-slate-500" />
                </span>
                <input
                  type="text"
                  name="invitationToken"
                  placeholder="Paste invitation token here"
                  disabled={loading || Boolean(urlToken)}
                  value={formData.invitationToken}
                  onChange={(e) => {
                    handleChange(e);
                    if (e.target.value.length > 20) fetchInvitationDetails(e.target.value.trim());
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                />
              </div>
              {invitedOrgDetails && (
                <div className="p-2.5 bg-brand-950/30 border border-brand-900/50 rounded-lg text-xs text-brand-300 flex flex-col gap-0.5">
                  <span className="font-semibold">Joining: {invitedOrgDetails.organizationName}</span>
                  <span className="text-[11px] text-slate-400">Assigned Role: {invitedOrgDetails.role}</span>
                </div>
              )}
              {fieldErrors.invitationToken && <p className="text-[11px] text-red-400 font-medium">{fieldErrors.invitationToken}</p>}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-500" />
                </span>
                <input
                  type="text"
                  name="username"
                  required
                  disabled={loading}
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="johndoe"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                />
              </div>
              {fieldErrors.username && <p className="text-[11px] text-red-400 font-medium">{fieldErrors.username}</p>}
            </div>

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
                  placeholder="john@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                />
              </div>
              {fieldErrors.email && <p className="text-[11px] text-red-400 font-medium">{fieldErrors.email}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-[11px] text-red-400 font-medium">{fieldErrors.password}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-500" />
                </span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  required
                  disabled={loading}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && <p className="text-[11px] text-red-400 font-medium">{fieldErrors.confirmPassword}</p>}
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="terms"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-brand-600 focus:ring-brand-500 h-4 w-4"
            />
            <label htmlFor="terms" className="text-xs text-slate-400">
              I agree to the <a href="#" className="text-brand-400 hover:underline">Terms of Service</a> & <a href="#" className="text-brand-400 hover:underline">Privacy Policy</a>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Complete Registration'}
          </button>
        </form>

        <div className="relative flex items-center justify-center my-2">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-slate-900 px-3 text-[11px] text-slate-500 uppercase font-medium">Or</span>
          <div className="border-t border-slate-800 w-full" />
        </div>

        <div id="google-signup-button" className="flex justify-center" />

        <p className="text-center text-xs text-slate-400 pt-2">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
