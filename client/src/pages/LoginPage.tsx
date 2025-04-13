import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { loginSuccess, setLoading, setError, isLoading, error, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate('/'); // Navigate to dashboard or home page
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call to /api/auth/login
      console.log('Attempting login with:', { email, password });
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate success
      const fakeToken = 'fake-jwt-token';
      const fakeUser = { id: '1', email: email, role: 'pet_owner', name: 'Test User' }; // Example user
      loginSuccess(fakeToken, fakeUser);
      navigate('/'); // Redirect to dashboard on successful login

    } catch (err) {
        // Simulate error
      console.error('Login failed:', err);
      const errorMessage = 'Invalid email or password.'; // Provide a user-friendly message
      setError(errorMessage);
      setLoading(false); // Ensure loading is set to false on error
    }
    // setLoading(false) is handled within loginSuccess or setError now
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p>
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
};

export default LoginPage; 