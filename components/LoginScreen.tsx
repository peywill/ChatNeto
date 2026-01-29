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
      // Timeout Logic
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT_ERROR')), 10000)
      );

      await Promise.race([
        signIn(email, password),
        timeoutPromise
      ]);
      
      setStatusMessage('Login success!');
      onLogin(email, password);
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.message === 'TIMEOUT_ERROR') {
        alert("Login Timed Out! \n\nCheck your internet.");
        setStatusMessage('Timed out.');
      } else {
        alert("Login Failed: \n\n" + (err.message || "Unknown error"));
        setStatusMessage('Error: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-white p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-3">
            <ChatNetoLogo className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-1.5">ChatNeto</h1>
          <p className="text-red-500 font-bold text-center text-sm">
            DEBUG MODE ACTIVE (v2)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {statusMessage && (
            <div className="bg-blue-50 text-blue-600 px-4 py-3 rounded-lg text-sm">
              {statusMessage}
            </div>
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600"
          >
            {loading ? 'Connecting...' : 'Login'}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button onClick={onSwitchToSignup} className="text-blue-500 text-sm hover:underline">
            Don't have an account? Sign up
          </button>
        </div>
      </div>
    </div>
  );
}

// CRITICAL LINE FOR BUILD SUCCESS
export default LoginScreen;
