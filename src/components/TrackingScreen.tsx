import React from 'react';
import { Coordinates, ThemeType, AlarmTriggerType } from '../types';
import { motion } from 'motion/react';
import { MapPin, Navigation } from 'lucide-react';
import { getThemeConfig } from '../themeConfig';

interface TrackingScreenProps {
  distance: number | null;
  radius: number;
  onCancel: () => void;
  theme: ThemeType;
  targetStationName: string | null;
  originalDestinationName: string | null;
  triggerType: AlarmTriggerType;
}

export function TrackingScreen({ distance, radius, onCancel, theme, targetStationName, originalDestinationName, triggerType }: TrackingScreenProps) {
  const isCalculating = distance === null;
  const config = getThemeConfig(theme);
  
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

      <div className="absolute top-12 text-center">
        <p className={`text-xs ${config.accentText} font-mono tracking-widest uppercase`}>Alarm armed</p>
        <p className={`text-xs mt-1 ${config.textMuted}`}>Trigger distance: 100m</p>
      </div>

      <div className="absolute bottom-12 w-full px-8 max-w-md mx-auto left-0 right-0">
        <button
          onClick={onCancel}
          className={`w-full border py-4 rounded-xl font-medium text-lg transition-all ${config.bgSurface} ${config.border} ${config.textMuted} hover:opacity-80 active:scale-[0.98]`}
        >
          Cancel Alarm
        </button>
      </div>
    </div>
  );
}
