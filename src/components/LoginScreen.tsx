import { useState, useEffect, useRef } from 'react';
import { ChatNetoLogo } from './ChatNetoLogo';
import { signIn } from '../lib/auth';

interface LoginScreenProps {
  onLogin: (session: any) => void;
  onSwitchToSignup: () => void;
}

export function LoginScreen({ onLogin, onSwitchToSignup }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Use useRef to track mounted state reliably across async operations
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      setLoading(true);
      setError('');
      try {
        // Reduced timeout to 8s
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timed out. Please check your internet connection.')), 8000)
        );

        const data: any = await Promise.race([
          signIn(email, password),
          timeoutPromise
        ]);
        
        // Check current value of ref, not a captured variable
        if (isMounted.current) {
          if (data?.session) {
             onLogin(data.session);
          } else {
             throw new Error('Login succeeded but no session was created.');
          }
        }
      } catch (err: any) {
        console.error('Login error:', err);
        if (isMounted.current) {
          if (err.message && err.message.includes('Invalid login credentials')) {
             setError('Invalid credentials. If you just signed up, please verify your email.');
          } else {
             setError(err.message || 'Failed to sign in');
          }
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    }
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-white p-6 overflow-y-auto">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-3">
            <ChatNetoLogo className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-1.5">ChatNeto</h1>
          <p className="text-gray-500 text-center text-sm">
            Welcome back! Sign in to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="bg-red-50 text-red-500 px-4 py-3 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
          </div>

          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            onClick={onSwitchToSignup}
            disabled={loading}
            className="text-blue-500 text-sm hover:underline disabled:opacity-50"
          >
            Don't have an account? Sign up
          </button>
        </div>
      </div>
    </div>
  );
}
