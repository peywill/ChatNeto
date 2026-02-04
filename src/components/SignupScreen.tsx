import { useState, useEffect, useRef } from 'react';
import { ChatNetoLogo } from './ChatNetoLogo';
import { signUp } from '../lib/auth';

interface SignupScreenProps {
  onSignup: (session: any) => void;
  onSwitchToLogin: () => void;
  errorMessage?: string;
}

const defaultAvatars = [
  'bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-yellow-400', 
  'bg-purple-400', 'bg-pink-400', 'bg-indigo-400', 'bg-orange-400'
];

export function SignupScreen({ onSignup, onSwitchToLogin, errorMessage }: SignupScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Correctly use useRef for tracking mounted state
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password && name) {
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      setLoading(true);
      setError('');

      try {
        const randomAvatar = defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];
        
        // Timeout protection
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timed out. Please check your internet connection.')), 10000)
        );

        const data: any = await Promise.race([
          signUp(email, password, name, randomAvatar),
          timeoutPromise
        ]);
        
        if (isMounted.current) {
          if (data?.session) {
             onSignup(data.session);
          } else if (data?.user) {
             if (!data.session) {
                setError('Account created! Please check your email to confirm.');
                setLoading(false);
             }
          }
        }
      } catch (err: any) {
        console.error('Signup error:', err);
        if (isMounted.current) {
          setError(err.message || 'Failed to create account');
          setLoading(false);
        }
      }
    }
  };

  // Show error from parent component
  const displayError = errorMessage || error;

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-white p-6 overflow-y-auto">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-3">
            <ChatNetoLogo className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-1.5">ChatNeto</h1>
          <p className="text-gray-500 text-center text-sm">
            Create your account to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {displayError && (
            <div className="bg-red-50 text-red-500 px-4 py-3 rounded-lg text-sm border border-red-100">
              {displayError}
            </div>
          )}

          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
          </div>

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
              placeholder="Password (min. 6 characters)"
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            onClick={onSwitchToLogin}
            disabled={loading}
            className="text-blue-500 text-sm hover:underline disabled:opacity-50"
          >
            Already have an account? Log in
          </button>
        </div>
      </div>
    </div>
  );
}
