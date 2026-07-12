import React from 'react';
import { Link } from 'react-router-dom';

const Signup = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Create an Account</h1>
          <p className="text-slate-500 mt-2">Sign up to get started</p>
        </div>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input type="text" className="w-full p-2 border border-slate-300 rounded outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" className="w-full p-2 border border-slate-300 rounded outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input type="password" className="w-full p-2 border border-slate-300 rounded outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 font-medium transition-colors">
            Sign up
          </button>
        </form>
        <div className="mt-4 text-center text-sm text-slate-600">
          Already have an account? <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-medium">Sign in</Link>
        </div>
      </div>
    </div>
  );
};
export default Signup;
