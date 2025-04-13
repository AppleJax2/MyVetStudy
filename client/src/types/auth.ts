// client/src/types/auth.ts

// Define a basic user profile structure
// We can expand this later based on the actual user data from the API
export interface UserProfile {
  id: string;
  email: string;
  name?: string; // Optional name field
  role: string; // e.g., 'admin', 'veterinarian', 'pet_owner'
  // Add other relevant user fields
}

// Define the state structure for the authentication store
export interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean; // To track loading state during auth operations
  error: string | null; // To store any authentication errors
}

// Define the actions available in the authentication store
export interface AuthActions {
  setToken: (token: string | null) => void;
  setUser: (user: UserProfile | null) => void;
  loginSuccess: (token: string, user: UserProfile) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Combine state and actions for the store type
export type AuthStore = AuthState & AuthActions; 