import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const Login = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to login');
      }

      const { user, token } = await res.json();
      login(user, token);

      // --- FINAL, DEFINITIVE FIX: Correctly handle admin role redirection ---
      if (user.role === 'admin') {
        navigate('/dashboard/admin');
      } else if (user.role === 'ems_personnel') {
        navigate('/dashboard/ems');
      } else {
        navigate('/dashboard/citizen');
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-wrapper">
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Log in to your account to continue.</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
            <div className="form-group">
                <label>Email</label>
                <input type="email" {...register('email')} />
                {errors.email && <p className="error-message">{errors.email.message}</p>}
            </div>
            <div className="form-group">
                <label>Password</label>
                <input type="password" {...register('password')} />
                {errors.password && <p className="error-message">{errors.password.message}</p>}
            </div>
            {error && <p className="submission-error">{error}</p>}
            <button type="submit" className="submit-button" disabled={isSubmitting}>
                {isSubmitting ? 'Logging In...' : 'Login'}
            </button>
        </form>
        <div className="auth-footer">
          <p>Don\'t have an account? <Link to="/register">Register</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
