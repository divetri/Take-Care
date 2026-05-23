import React, { useState } from 'react';
import { ThemeType } from '../types';
import { getThemeConfig } from '../themeConfig';

export function NameInputScreen({ theme, onSave }: { theme: ThemeType, onSave: (name: string) => void }) {
  const config = getThemeConfig(theme);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const isDev = name.trim().toLowerCase() === 'divetri';

  const handleSave = () => {
    setError('');
    if (isDev && password !== 'coffee123') {
      setError('Incorrect developer password.');
      return;
    }
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  return (
    <div className={`flex flex-col h-screen items-center justify-center px-5 sm:px-8 ${config.bgMain} ${config.textMain} ${config.selection}`}>
      <div className="w-full max-w-sm flex flex-col items-center">
        <h1 className="text-3xl font-light mb-8 text-center tracking-tight">What should I call you?</h1>
        <input 
          type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`w-full p-5 text-center rounded-2xl border outline-none bg-transparent ${config.border} ${config.textMain} focus:border-current text-xl mb-5 transition-all shadow-sm`}
          placeholder="Enter your name"
          autoFocus
        />
        
        {isDev && (
          <div className="w-full relative mb-5">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full p-5 text-center rounded-2xl border outline-none bg-transparent ${error ? 'border-red-500' : config.border} ${config.textMain} focus:border-current text-xl transition-all shadow-sm animate-in fade-in`}
              placeholder="Developer Password"
            />
            {error && (
              <p className="text-red-500 text-sm font-medium mt-2 text-center absolute -bottom-6 w-full animate-in slide-in-from-top-1">
                {error}
              </p>
            )}
          </div>
        )}

        <button 
          onClick={handleSave}
          disabled={!name.trim() || (isDev && !password)}
          className={`w-full py-5 rounded-2xl font-medium text-lg shadow-lg ${config.buttonPrimaryBg} ${config.buttonPrimaryText} ${config.buttonPrimaryHover} transition-all disabled:opacity-50 mt-3 hover:scale-[1.01] active:scale-[0.98]`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

