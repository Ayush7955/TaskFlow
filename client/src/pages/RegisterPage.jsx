import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore';
import Button from '../components/Button';
import Input from '../components/Input';
import OrbDecoration from '../components/OrbDecoration';

export default function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const login = useAuthStore((s) => s.login);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
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

  const validate = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password });
      toast.success('Account created successfully!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Registration failed. Please try again.';
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
          Create your account.
        </h1>
        <p className="text-muted text-sm mt-2 font-body">
          Start managing tasks with your team
        </p>

        {/* 1-Click Demo Login Banner */}
        <div className="mt-6 p-4 rounded-xl bg-stone-50 border border-border">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-ink font-body">Instant Demo Access</p>
              <p className="text-[11px] text-secondary font-body mt-0.5">Skip sign up — 8 boards, 68+ tasks & team ready</p>
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
          <span className="relative bg-surface px-3 text-xs text-muted font-body">or register a new account</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Full name"
            type="text"
            placeholder="Jane Smith"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
            }}
            error={errors.name}
            autoComplete="name"
          />

          <Input
            label="Email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
            }}
            error={errors.email}
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            placeholder="Minimum 8 characters"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password)
                setErrors((prev) => ({ ...prev, password: '' }));
            }}
            error={errors.password}
            autoComplete="new-password"
          />

          <Input
            label="Confirm password"
            type="password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword)
                setErrors((prev) => ({ ...prev, confirmPassword: '' }));
            }}
            error={errors.confirmPassword}
            autoComplete="new-password"
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            loading={isSubmitting}
          >
            Get started →
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-border text-center">
          <p className="text-sm text-muted font-body">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-ink font-medium hover:underline underline-offset-4"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
