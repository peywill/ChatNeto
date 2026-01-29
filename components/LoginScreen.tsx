import { useState, useEffect } from 'react';
import { ChatNetoLogo } from './ChatNetoLogo';
import { signIn } from '../lib/auth';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => void;
  onSwitchToSignup: () => void;
}

export function LoginScreen({ onLogin, onSwitchToSignup }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      alert("Please enter both email and password");
      return;
    }

    setLoading(true);
    setStatusMessage('Attempting to connect...');
    
    try {
      // 1. Create a timeout that rejects after 10 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('TIMEOUT_ERROR'));
        }, 10000);
      });

      // 2. Race the login against the timeout
      await Promise.race([
        signIn(email, password),
        timeoutPromise
      ]);
      
      setStatusMessage('Login success!');
      onLogin(email, password);
      
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Handle the specific errors
      if (err.message === 'TIMEOUT_ERROR') {
        alert("Login Timed Out! \n\nThe server is not responding. Please check your internet connection and try again.");
        setStatusMessage('Connection timed out.');
      } else {
        alert("Login Failed: \n\n" + (err.message || "Unknown error"));
        setStatusMessage('Error: ' + err.message);
      }
    } finally {
      setLoading(false);
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
            Debug Mode Active
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {statusMessage && (
            <div className={`px-4 py-3 rounded-lg text-sm ${statusMessage.includes('Error') || statusMessage.includes('time') ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'}`}>
              {statusMessage}
            </div>
          )}

          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            {loading ? 'Connecting...' : 'Login'}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            onClick={onSwitchToSignup}
            className="text-blue-500 text-sm hover:underline"
          >
            Don't have an account? Sign up
          </button>
        </div>
      </div>
    </div>
  );
}
