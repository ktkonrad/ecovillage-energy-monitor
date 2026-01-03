import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { generateMockData, RESIDENTS as MOCK_RESIDENTS, DWELLINGS as MOCK_DWELLINGS } from './services/mockData';
import { emporiaService } from './services/emporiaService';
import { UsageRecord, Resident, Dwelling } from './types';
import { Leaf, LogOut, Settings, CloudLightning, Lock, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data State
  const [data, setData] = useState<UsageRecord[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [dwellings, setDwellings] = useState<Dwelling[]>([]);
  const [useMock, setUseMock] = useState(false);

  // Login Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (useMock) {
      // Use Simulation
      setTimeout(() => {
        setData(generateMockData(30));
        setResidents(MOCK_RESIDENTS);
        setDwellings(MOCK_DWELLINGS);
        setIsLoggedIn(true);
        setIsLoading(false);
      }, 1000);
      return;
    }

    try {
      // 1. Authenticate
      await emporiaService.login(email, password);
      
      // 2. Fetch Data
      const { residents: res, dwellings: dw, usage } = await emporiaService.fetchCommunityData();
      
      setResidents(res);
      setDwellings(dw);
      setData(usage);
      setIsLoggedIn(true);

    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('Network Error') || err.name === 'AxiosError') {
         setError("CORS Error: The browser blocked the request to Emporia. This is common in browser-only apps. Please check 'Use Demo Mode' to visualize the dashboard.");
      } else {
         setError(err.message || "Failed to login. Please check credentials.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-stone-200">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-emerald-100 p-4 rounded-full mb-4">
              <Leaf className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-stone-800">Eco-Village Monitor</h1>
            <p className="text-stone-500 text-center mt-2">Sign in to view real-time community energy</p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2 text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                placeholder="name@example.com"
                required
              />
            </div>
            {!useMock && (
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Password</label>
                <div className="relative">
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    placeholder="Enter your Emporia password"
                    required={!useMock}
                  />
                  <Lock className="absolute right-3 top-2.5 w-4 h-4 text-stone-400" />
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-2 pt-2">
              <input 
                type="checkbox" 
                id="useMock" 
                checked={useMock} 
                onChange={(e) => {
                  setUseMock(e.target.checked);
                  setError(null);
                }}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="useMock" className="text-sm text-stone-600 cursor-pointer">
                Use Demo Mode (Simulation)
              </label>
            </div>

            <div className="pt-2">
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center disabled:opacity-70"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Connecting...
                  </span>
                ) : (
                  useMock ? 'Launch Simulation' : 'Connect with Emporia'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-600 p-1.5 rounded-lg">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-stone-800 tracking-tight">EcoMonitor</span>
            <span className="hidden md:inline-block px-2 py-0.5 rounded text-xs font-medium bg-stone-100 text-stone-500 border border-stone-200">
              Community Edition
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center text-sm text-stone-600 mr-2">
              <CloudLightning className={`w-4 h-4 mr-1 ${useMock ? 'text-amber-500' : 'text-emerald-500'}`} />
              <span>Source: <span className="font-medium text-stone-800">{useMock ? 'Simulation' : 'Live Emporia API'}</span></span>
            </div>
            <button className="p-2 hover:bg-stone-100 rounded-full text-stone-500 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                setIsLoggedIn(false);
                setData([]);
                setResidents([]);
                setDwellings([]);
                setPassword("");
              }}
              className="flex items-center space-x-2 text-stone-500 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-900">Energy Overview</h1>
          <p className="text-stone-500">
             Tracking {dwellings.length} locations and {residents.length} monitored devices
          </p>
        </div>

        <Dashboard data={data} residents={residents} dwellings={dwellings} />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-stone-400 text-sm">
          &copy; {new Date().getFullYear()} Eco-Village Energy Monitor. Built for the community.
        </div>
      </footer>
    </div>
  );
};

export default App;