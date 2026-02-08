import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const Register = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to register');
      }

      navigate('/login');
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
          <h2>Create Your Account</h2>
          <p>Join to get a more personalized experience.</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
            <div className="form-group">
                <label>First Name</label>
                <input {...register('firstName')} />
                {errors.firstName && <p className="error-message">{errors.firstName.message}</p>}
            </div>
            <div className="form-group">
                <label>Last Name</label>
                <input {...register('lastName')} />
                {errors.lastName && <p className="error-message">{errors.lastName.message}</p>}
            </div>
            <div className="form-group">
                <label>Email</label>
                <input type="email" {...register('email')} />
                {errors.email && <p className="error-message">{errors.email.message}</p>}
            </div>
             <div className="form-group">
                <label>Phone Number</label>
                <input {...register('phoneNumber')} />
                {errors.phoneNumber && <p className="error-message">{errors.phoneNumber.message}</p>}
            </div>
            <div className="form-group">
                <label>Password</label>
                <input type="password" {...register('password')} />
                {errors.password && <p className="error-message">{errors.password.message}</p>}
            </div>
            {error && <p className="submission-error">{error}</p>}
            <button type="submit" className="submit-button" disabled={isSubmitting}>
                {isSubmitting ? 'Registering...' : 'Register'}
            </button>
        </form>
        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Log In</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
