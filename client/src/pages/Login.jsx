import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from '../api';
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
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        // Handle non-JSON error responses gracefully
        const errorText = await res.text();
        try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.message || 'Failed to login');
        } catch (jsonError) {
            // If parsing fails, the error response was not JSON.
            // Throw the raw text as the error.
            throw new Error(errorText || `HTTP error! status: ${res.status}`);
        }
      }

      const { user, token } = await res.json();
      login(user, token);

      if (user.role === 'admin') {
        navigate('/dashboard/admin');
      } else if (user.role === 'ems_personnel') {
        navigate('/dashboard/ems');
      } else {
        navigate('/dashboard/citizen');
      }

    } catch (err) {
      console.error('Login Error:', err);
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
          <p>Don't have an account? <Link to="/register">Register</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
