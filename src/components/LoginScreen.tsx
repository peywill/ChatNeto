import { useState, useEffect, useRef } from 'react';
import { Settings, Server, AlertCircle, CheckCircle2, Terminal } from 'lucide-react';
import { ChatNetoLogo } from './ChatNetoLogo';
import { signIn, supabase } from '../lib/auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface LoginScreenProps {
  onLogin: (session: any) => void;
  onSwitchToSignup: () => void;
}

export function LoginScreen({ onLogin, onSwitchToSignup }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Connection Settings State
  const [customUrl, setCustomUrl] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [currentUrl, setCurrentUrl] = useState('');

  // Debug Logs State
  const [logs, setLogs] = useState<string[]>([]);
  const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString().split(' ')[0]}: ${msg}`]);

  // Use useRef to track mounted state reliably across async operations
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    checkConnection();
    addLog('Login Screen Mounted. Ready.');
    return () => { isMounted.current = false; };
  }, []);

  const checkConnection = async () => {
    // @ts-ignore
    const url = supabase.supabaseUrl;
    setCurrentUrl(url);
    
    try {
      addLog(`Checking connection to ${url?.substring(0, 15)}...`);
      const { error } = await supabase.auth.getSession();
      if (isMounted.current) {
        if (error) {
            setConnectionStatus('error');
            addLog('Connection Check Failed: ' + error.message);
        } else {
            setConnectionStatus('connected');
            addLog('Connection Check: OK');
        }
      }
    } catch (e: any) {
      if (isMounted.current) {
        setConnectionStatus('error');
        addLog('Connection Exception: ' + e.message);
      }
    }
  };

  const saveConnectionSettings = () => {
    const trimmedUrl = customUrl.trim();
    const trimmedKey = customKey.trim();

    if (!trimmedUrl || !trimmedKey) {
      alert("Please enter both the Supabase URL and the Anon Key.");
      return;
    }

    if (!trimmedUrl.startsWith('https://')) {
      alert("The URL must start with https://");
      return;
    }

    if (trimmedKey.startsWith('sb_')) {
      alert("It looks like you pasted a Publishable Key (starts with sb_). Please use the Anon Key (starts with ey...).");
      return;
    }

    try {
      localStorage.setItem('chatneto-supabase-url', trimmedUrl);
      localStorage.setItem('chatneto-supabase-key', trimmedKey);
      
      const button = document.getElementById('save-connection-btn');
      if (button) button.innerText = "Saved! Reloading...";
      
      setTimeout(() => {
        window.location.reload(); 
      }, 500);
    } catch (e) {
      console.error("Failed to save settings:", e);
      alert("Failed to save settings to local storage.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError('');
    addLog('--- Starting Login Process ---');
    addLog(`Email: ${email}`);
    
    try {
      // Reduced timeout to 15s to be safe
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timed out (15s limit).')), 15000)
      );

      addLog('Calling signIn...');
      const data: any = await Promise.race([
        signIn(email, password),
        timeoutPromise
      ]);
      
      addLog('SignIn resolved.');
      
      if (isMounted.current) {
        if (data?.session) {
           addLog('Session found! ID: ' + data.session.user.id.substring(0,5));
           addLog('Calling onLogin callback...');
           onLogin(data.session);
           addLog('onLogin called. Waiting for redirect...');
        } else if (data?.user && !data?.session) {
           addLog('User found but NO SESSION.');
           setError('Unable to establish session. Email verification might be required?');
           setLoading(false);
        } else {
           addLog('No session and no user returned.');
           throw new Error('Login succeeded but no session was created.');
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      addLog('ERROR CAUGHT: ' + err.message);
      if (isMounted.current) {
        if (err.message && err.message.includes('Invalid login credentials')) {
           setError('Invalid credentials. Please check your email and password.');
        } else if (err.message && (err.message.includes('fetch') || err.message.includes('network'))) {
           setError('Network Error: Unable to connect to Supabase. Your project might be paused or you are offline.');
           setConnectionStatus('error');
        } else {
           setError(err.message || 'Failed to sign in. Please try again.');
        }
        setLoading(false);
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
            type="button"
            onClick={onSwitchToSignup}
            disabled={loading}
            className="text-blue-500 text-sm hover:underline disabled:opacity-50"
          >
            Don't have an account? Sign up
          </button>
          
          <div className="mt-6 flex flex-col items-center gap-1">
             <div className="text-xs text-gray-300 font-mono">v1.6 (Connection Fix)</div>
          </div>
        </div>
      </div>
      
      {/* Debug Console */}
      <div className="w-full max-w-sm mt-8 border border-gray-200 rounded-md overflow-hidden bg-gray-50">
         <div className="bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500 flex items-center gap-2">
            <Terminal className="w-3 h-3" /> Debug Logs
         </div>
         <div className="h-32 overflow-y-auto p-2 font-mono text-xs text-gray-600 space-y-1">
            {logs.length === 0 ? <span className="text-gray-400 italic">Logs will appear here...</span> : logs.map((log, i) => (
                <div key={i} className="border-b border-gray-100 pb-0.5 last:border-0">{log}</div>
            ))}
         </div>
      </div>

      {/* Connection Debugger / Settings */}
      <div className="absolute top-4 right-4">
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogTrigger asChild>
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connection Settings</DialogTitle>
              <DialogDescription>
                Configure your Supabase connection manually if environment variables are missing.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                 <div className="flex items-center gap-2 mb-2">
                    <Server className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-700">Current Status:</span>
                    {connectionStatus === 'checking' && <span className="text-yellow-600">Checking...</span>}
                    {connectionStatus === 'connected' && <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Connected</span>}
                    {connectionStatus === 'error' && <span className="text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Disconnected</span>}
                 </div>
                 <div className="text-xs text-gray-400 break-all font-mono">
                    {currentUrl}
                 </div>
              </div>

              <div className="space-y-2">
                <Label>Supabase URL</Label>
                <Input 
                  placeholder="https://your-project.supabase.co" 
                  value={customUrl}
                  onChange={e => setCustomUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Supabase Anon Key</Label>
                <Input 
                  type="password"
                  placeholder="eyJh..." 
                  value={customKey}
                  onChange={e => setCustomKey(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSettings(false)}>Cancel</Button>
              <Button 
                id="save-connection-btn"
                onClick={saveConnectionSettings}
                disabled={!customUrl || !customKey}
              >
                Save & Reload
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
