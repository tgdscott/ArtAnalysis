import React, { useState } from 'react';
import { User, ArrowRight, Sparkles } from 'lucide-react';
import { storageService } from '../services/storageService';
import { User as UserType } from '../types';

interface LoginProps {
  onLogin: (user: UserType) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    
    setIsLoading(true);
    try {
      const user = await storageService.loginOrRegister(name, email, username);
      // Small artificial delay for UX feel
      setTimeout(() => {
        onLogin(user);
        setIsLoading(false);
      }, 800);
    } catch (error) {
      console.error("Login failed", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in-up">
        
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
             <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Welcome to Projective Art</h1>
          <p className="text-indigo-100 text-sm">Sign in to start your analysis session.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={18} />
              <input 
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="Jane Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
            <input 
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="jane@example.com"
            />
          </div>

          <div>
             <div className="flex justify-between mb-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Username</label>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Optional</span>
             </div>
            <input 
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="Leave blank to use email"
            />
          </div>

          <button 
            type="submit"
            disabled={!name || !email || isLoading}
            className={`
              w-full py-3 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all mt-4
              ${(!name || !email || isLoading) 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200 hover:-translate-y-0.5'}
            `}
          >
            {isLoading ? 'Signing In...' : 'Enter Lab'} 
            {!isLoading && <ArrowRight size={20} />}
          </button>
        </form>

        <div className="bg-gray-50 px-8 py-4 text-center border-t border-gray-100">
           <p className="text-xs text-gray-400">No password required. We identify you by email for this session.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;