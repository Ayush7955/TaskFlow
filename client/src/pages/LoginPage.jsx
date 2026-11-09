import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore';
import Button from '../components/Button';
import Input from '../components/Input';
import OrbDecoration from '../components/OrbDecoration';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDemoSignIn = async () => {
    setIsSubmitting(true);
    try {
      await login('alice@taskflow.dev', 'Password123!');
      toast.success('Logged in as Alice (Acme Corp)');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error('Failed to log in with demo account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Invalid credentials. Please try again.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-canvas flex items-center justify-center overflow-hidden px-4">
      {/* Decorative orbs */}
      <OrbDecoration
        variant="lavender"
        size="lg"
        className="-top-20 -right-20"
      />
      <OrbDecoration
        variant="peach"
        size="lg"
        className="-bottom-20 -left-20"
      />

      {/* Card */}
      <div className="relative w-full max-w-md bg-surface rounded-xl shadow-card p-8">
        <h1 className="font-display font-light text-3xl text-ink">
          Welcome back.
        </h1>
        <p className="text-muted text-sm mt-2 font-body">
          Sign in to your workspace
        </p>

        {/* 1-Click Demo Login Banner */}
        <div className="mt-6 p-4 rounded-xl bg-stone-50 border border-border">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-ink font-body">Demo Workspace (Acme Corp)</p>
              <p className="text-[11px] text-secondary font-body mt-0.5">8 boards, 68+ tasks, team members & checklists</p>
            </div>
            <button
              type="button"
              onClick={handleDemoSignIn}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 text-xs font-body font-medium bg-ink text-canvas rounded-pill hover:bg-stone-800 transition-colors shadow-xs shrink-0"
            >
              Demo Sign In →
            </button>
          </div>
        </div>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <span className="relative bg-surface px-3 text-xs text-muted font-body">or continue with credentials</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            loading={isSubmitting}
          >
            Sign in →
          </Button>
        </form>

        <div className="mt-5 text-center">
          <Link
            to="/forgot-password"
            className="text-sm text-muted hover:text-ink transition-colors duration-150 font-body"
          >
            Forgot password?
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-border text-center">
          <p className="text-sm text-muted font-body">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="text-ink font-medium hover:underline underline-offset-4"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
