import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState(''); // Optional field
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();
  const { loginSuccess, setLoading, setError, isLoading, error, isAuthenticated } = useAuthStore();
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setRegistrationError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null); // Clear general auth errors
    setRegistrationError(null); // Clear specific registration errors

    try {
      // TODO: Replace with actual API call to /api/auth/register
      const registrationData = { email, password, name: name || undefined }; // Send name only if provided
      console.log('Attempting registration with:', registrationData);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate success - often registration might auto-login or require email verification.
      // Assuming auto-login for now:
      const fakeToken = 'fake-jwt-token-registered';
      const fakeUser = { id: '2', email: email, role: 'pet_owner', name: name || 'New User' };
      loginSuccess(fakeToken, fakeUser);
      navigate('/'); // Redirect to dashboard

    } catch (err) {
        // Simulate error
      console.error('Registration failed:', err);
      // Use a specific registration error state to avoid confusion with login errors
      const errorMessage = 'Registration failed. Please try again.'; // Or parse specific error from API response
      setRegistrationError(errorMessage);
      setLoading(false); // Ensure loading is set to false on error
    }
    // setLoading(false) is handled within loginSuccess or if an error occurs
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
      <div>
          <label htmlFor="name">Name (Optional):</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
          />
        </div>
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
        <div>
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        {registrationError && <p style={{ color: 'red' }}>{registrationError}</p>}
        {/* Display general auth error as well if needed, though less likely for registration */}
        {/* {error && <p style={{ color: 'red' }}>{error}</p>} */}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <p>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
};

export default RegisterPage; 