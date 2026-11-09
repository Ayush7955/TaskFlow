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

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
