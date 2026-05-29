import React, { useState } from 'react';
import { Coordinates, ThemeType, AlarmTriggerType } from '../types';
import { motion } from 'motion/react';
import { MapPin, Navigation, Settings } from 'lucide-react';
import { getThemeConfig } from '../themeConfig';

interface TrackingScreenProps {
  distance: number | null;
  radius: number;
  onCancel: () => void;
  onOpenSettings: () => void;
  theme: ThemeType;
  targetStationName: string | null;
  originalDestinationName: string | null;
  triggerType: AlarmTriggerType;
}

export function TrackingScreen({ 
  distance, 
  radius, 
  onCancel, 
  onOpenSettings,
  theme, 
  targetStationName, 
  originalDestinationName, 
  triggerType 
}: TrackingScreenProps) {
  const isCalculating = distance === null;
  const config = getThemeConfig(theme);
  const [showConfirm, setShowConfirm] = useState(false);
  
  return (
    <div className={`flex flex-col h-screen overflow-hidden items-center justify-center p-6 relative transition-colors ${config.bgMain} ${config.textMain} ${config.selection}`}>
      
      {/* Background pulsating effect representing scanning radar */}
      <motion.div 
        animate={{ scale: [1, 1.5, 2], opacity: [0.5, 0.2, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeOut' }}
        className={`absolute w-64 h-64 border rounded-full ${config.border}`}
      />
      <motion.div 
        animate={{ scale: [1, 2, 3], opacity: [0.3, 0.1, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeOut', delay: 1 }}
        className={`absolute w-64 h-64 border rounded-full opacity-50 ${config.border}`}
      />

      <div className="relative z-10 flex flex-col items-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-8 border ${config.bgSurface} ${config.border} shadow-[0_0_30px_rgba(0,0,0,0.2)]`}>
          <Navigation className={`w-8 h-8 ${config.accentText}`} />
        </div>

        {isCalculating ? (
          <div className="text-center">
            <h2 className="text-5xl font-light tracking-tight mb-2">Acquiring</h2>
            <p className={`${config.textMuted}`}>Waiting for GPS signal...</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <h2 className="text-7xl font-light tracking-tighter">
                {distance >= 1000 ? (distance / 1000).toFixed(1) : Math.round(distance)}
              </h2>
              <span className={`text-2xl font-medium ${config.textMuted}`}>
                {distance >= 1000 ? 'km' : 'm'}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <p className={`font-medium tracking-wide text-sm flex items-center justify-center gap-2 ${config.textMuted}`}>
                <MapPin className="w-4 h-4" />
                TILL {targetStationName ? targetStationName.toUpperCase() : "DESTINATION"}
              </p>
              {triggerType === '1_station' && (
                <p className={`mt-1 text-xs font-medium ${config.textMuted} opacity-80 uppercase tracking-widest`}>(one station before {originalDestinationName})</p>
              )}
              {triggerType === '2_stations' && (
                <p className={`mt-1 text-xs font-medium ${config.textMuted} opacity-80 uppercase tracking-widest`}>(two stations before {originalDestinationName})</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="absolute top-10 right-6 z-20">
        <button
          onClick={onOpenSettings}
          className={`p-3 rounded-full border transition-all ${config.bgSurface} ${config.border} ${config.textMuted} hover:opacity-80 active:scale-[0.95]`}
          aria-label="Open Settings"
        >
          <Settings className="w-5 h-5 animate-[spin_8s_linear_infinite]" />
        </button>
      </div>

      <div className="absolute top-12 text-center">
        <p className={`text-xs ${config.accentText} font-mono tracking-widest uppercase`}>Alarm armed</p>
        <p className={`text-xs mt-1 ${config.textMuted}`}>Trigger distance: 100m</p>
      </div>

      <div className="absolute bottom-12 w-full px-8 max-w-md mx-auto left-0 right-0">
        <button
          onClick={() => setShowConfirm(true)}
          className={`w-full border py-4 rounded-xl font-medium text-lg transition-all ${config.bgSurface} ${config.border} ${config.textMuted} hover:opacity-80 active:scale-[0.98]`}
        >
          Cancel Alarm
        </button>
      </div>

      {showConfirm && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`w-full max-w-sm rounded-2xl p-6 shadow-2xl ${config.bgSurface} ${config.textMain} border ${config.border} text-center`}
          >
            <h3 className="text-xl font-bold mb-2">Are you sure?</h3>
            <p className={`text-sm mb-6 ${config.textMuted} leading-relaxed`}>
              Do you want to cancel the alarm tracking and return to the main screen?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowConfirm(false);
                  onCancel();
                }}
                className={`w-full py-3 rounded-xl font-medium transition-all bg-red-500 text-white hover:bg-red-600 active:scale-[0.98]`}
              >
                Yes, Cancel Alarm
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className={`w-full py-3 rounded-xl font-medium border transition-all ${config.bgMain} ${config.border} ${config.textMain} hover:opacity-80 active:scale-[0.98]`}
              >
                Keep Alarm Armed
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
