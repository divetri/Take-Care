import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { ThemeType } from '../types';
import { getThemeConfig } from '../themeConfig';

interface AlarmScreenProps {
  onStop: () => void;
  theme: ThemeType;
  userName: string | null;
  stationName?: string | null;
  isTransit?: boolean;
}

export function AlarmScreen({ onStop, theme, userName, stationName, isTransit }: AlarmScreenProps) {
  const config = getThemeConfig(theme);
  
  // Try to keep screen awake if supported
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err: any) {
        // Silently handle if wake lock is not allowed by iframe permissions
        console.warn("Wake-lock not available:", err.message);
      }
    };
    requestWakeLock();
    
    return () => {
      if (wakeLock !== null) {
        wakeLock.release().catch(console.error);
      }
    };
  }, []);

  return (
    <div className={`flex flex-col h-screen items-center justify-center relative touch-none selection:bg-transparent transition-colors ${config.bgMain} ${config.textMain}`}>
      
      <motion.div 
        animate={{ opacity: [0.1, 0.3, 0.1] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className={`absolute inset-0 bg-gradient-to-t z-0 pointer-events-none from-transparent via-[var(--tw-gradient-stops)] to-transparent`}
        style={{
           // Inline style hack to inject our color theme into the gradient since we can't easily map it to TW arbitrarily without passing real colors
           backgroundImage: `radial-gradient(circle at center, ${config.textMain}22 0%, transparent 70%)`
        }}
      />

      <motion.div 
        animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className={`z-10 p-8 rounded-full mb-8 border ${config.bgSurface} ${config.border} shadow-[0_0_50px_rgba(0,0,0,0.1)]`}
      >
        <div className={`w-16 h-16 rounded-full border flex items-center justify-center p-1 ${config.border}`}>
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
              className={`w-full h-full rounded-full ${config.buttonPrimaryBg}`} 
            />
        </div>
      </motion.div>

      <div className="z-10 text-center mb-24 max-w-[80%] mx-auto">
        <h1 className={`text-4xl font-light mb-3 tracking-wide ${config.textMain}`}>
          {isTransit ? 'Transit Station!' : `Time to shine, ${userName || 'Traveler'}!`}
        </h1>
        <p className={`font-light text-lg leading-relaxed ${config.textMuted}`}>
          {isTransit 
            ? `You have arrived near your transit station: ${stationName || 'the transit point'}. Prepare to transfer lines!` 
            : `You have arrived near your station: ${stationName || 'your destination'}. Prepare to exit!`}
        </p>
      </div>

      <div className="z-10 w-full absolute bottom-16 px-8 max-w-md mx-auto left-0 right-0">
        <button
          onClick={onStop}
          className={`w-full py-5 rounded-xl font-medium text-lg tracking-wide shadow-lg hover:scale-[1.01] active:scale-[0.98] transition-all ${config.buttonPrimaryBg} ${config.buttonPrimaryText} ${config.buttonPrimaryHover}`}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
