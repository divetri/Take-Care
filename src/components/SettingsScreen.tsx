import React, { useRef } from 'react';
import { AppSettings, ThemeType, AlarmModeType, SoundPresetType } from '../types';
import { X, Upload, Play, Volume2, Vibrate, Sun, Moon, Palette, Zap } from 'lucide-react';
import { startAlarmAudio, stopAlarmAudio } from '../utils';
import { getThemeConfig } from '../themeConfig';

interface SettingsScreenProps {
  settings: AppSettings;
  onUpdate: (newSettings: Partial<AppSettings>) => void;
  onClose: () => void;
  hideUsernameReset?: boolean;
}

export function SettingsScreen({ settings, onUpdate, onClose, hideUsernameReset = false }: SettingsScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const config = getThemeConfig(settings.theme);

  const triggerLightHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(35);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File is too large. Please select a sound under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        onUpdate({ customSoundUrl: ev.target.result, soundPreset: 'custom' });
        triggerLightHaptic();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTestAlarm = () => {
    triggerLightHaptic();
    startAlarmAudio(settings);
    setTimeout(() => {
      stopAlarmAudio();
    }, 3000);
  };

  const handleTestVibrationOnly = () => {
    if ('vibrate' in navigator) {
      // Custom recognizable dual-high-impact physical alert pulse to feel immediately
      navigator.vibrate([300, 150, 300, 150, 500]);
    } else {
      alert("Web Vibration API is unavailable. To test on iPhone/iOS, open the app in Safari, tap Share, and select 'Add to Home Screen'. On Android, Chrome supports it natively.");
    }
  };

  const themeOptions: { value: ThemeType, label: string, icon: React.ReactNode }[] = [
    { value: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" /> },
    { value: 'light', label: 'Light', icon: <Sun className="w-4 h-4" /> },
    { value: 'pastel', label: 'Pastel', icon: <Palette className="w-4 h-4" /> },
    { value: 'neon', label: 'Neon', icon: <Zap className="w-4 h-4" /> },
  ];

  const alarmModeOptions: { value: AlarmModeType, label: string, icon: React.ReactNode }[] = [
    { value: 'ring', label: 'Ring', icon: <Volume2 className="w-4 h-4" /> },
    { value: 'vibrate', label: 'Vibrate', icon: <Vibrate className="w-4 h-4" /> },
    { value: 'ring-vibrate', label: 'Ring & Vibrate', icon: <div className="flex"><Volume2 className="w-3 h-3"/><Vibrate className="w-3 h-3"/></div> },
  ];

  const soundOptions: { value: SoundPresetType, label: string }[] = [
    { value: 'gentle', label: 'Gentle Chime' },
    { value: 'urgent', label: 'Urgent Beep' },
    { value: 'custom', label: 'Custom Audio' },
  ];

  return (
    <div className="absolute inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] ${config.bgSurface} ${config.textMain}`}>
        
        <div className={`flex items-center justify-between p-4 border-b ${config.border}`}>
          <h2 className="text-lg font-bold">Settings</h2>
          <button onClick={onClose} className={`p-2 rounded-full hover:opacity-70 transition-opacity`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8 flex-1">
          {/* Theme */}
          <section>
            <h3 className={`text-sm font-semibold mb-3 uppercase tracking-wider ${config.textMuted}`}>Appearance</h3>
            <div className="grid grid-cols-2 gap-3">
              {themeOptions.map(t => (
                <button
                  key={t.value}
                  onClick={() => { onUpdate({ theme: t.value }); triggerLightHaptic(); }}
                  className={`flex items-center gap-2 p-3 border rounded-xl transition-all ${settings.theme === t.value ? `${config.accentBg} ${config.accentText} border-transparent` : `${config.bgMain} ${config.border} hover:opacity-80`}`}
                >
                  {t.icon}
                  <span className="font-medium text-sm">{t.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Alarm Mode */}
          <section>
             <h3 className={`text-sm font-semibold mb-3 uppercase tracking-wider ${config.textMuted}`}>Alarm Mode</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {alarmModeOptions.map(m => (
                <button
                  key={m.value}
                  onClick={() => { onUpdate({ alarmMode: m.value }); triggerLightHaptic(); }}
                  className={`flex flex-col items-center justify-center gap-2 p-3 border rounded-xl transition-all ${settings.alarmMode === m.value ? `${config.accentBg} ${config.accentText} border-transparent` : `${config.bgMain} ${config.border} hover:opacity-80`}`}
                >
                  {m.icon}
                  <span className="font-medium text-xs text-center">{m.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Sound Preset */}
          <section>
            <h3 className={`text-sm font-semibold mb-3 uppercase tracking-wider ${config.textMuted}`}>Alarm Sound</h3>
            <div className="flex flex-col gap-3">
              {soundOptions.map(s => (
                <label key={s.value} className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${settings.soundPreset === s.value ? `${config.accentBg} ${config.accentText} border-transparent` : `${config.bgMain} ${config.border} hover:opacity-80`}`}>
                  <input 
                    type="radio" 
                    name="soundPreset" 
                    value={s.value} 
                    checked={settings.soundPreset === s.value} 
                    onChange={() => { onUpdate({ soundPreset: s.value }); triggerLightHaptic(); }}
                    className="mr-3"
                  />
                  <span className="font-medium flex-1">{s.label}</span>
                </label>
              ))}
            </div>

            {settings.soundPreset === 'custom' && (
               <div className="mt-4">
                 <input 
                    type="file" 
                    accept="audio/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                 />
                 <button 
                   onClick={() => fileInputRef.current?.click()}
                   className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border ${config.bgMain} ${config.border} hover:opacity-80 transition-opacity font-medium text-sm`}
                 >
                   <Upload className="w-4 h-4" />
                   {settings.customSoundUrl ? "Replace Custom Sound" : "Upload Sound (Max 2MB)"}
                 </button>
               </div>
            )}

            <div className="mt-6 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleTestAlarm}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl font-medium transition-all text-xs sm:text-sm ${config.buttonPrimaryBg} ${config.buttonPrimaryText} ${config.buttonPrimaryHover}`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  Test Alarm
                </button>
                <button 
                  onClick={handleTestVibrationOnly}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border border-gray-500/20 font-medium transition-all text-xs sm:text-sm bg-gray-500/10 text-current hover:bg-gray-500/20`}
                >
                  <Vibrate className="w-4 h-4 text-green-500 animate-pulse" />
                  Test Vibrate
                </button>
              </div>
              <p className={`text-[11px] leading-relaxed text-center font-light ${config.textMuted} mt-1`}>
                📲 <strong>Mobile Tip:</strong> Open on your mobile phone, tap <strong>Share</strong>, then <strong>Add to Home Screen</strong> to run in immersive fullscreen with native vibration.
              </p>
            </div>
          </section>

          {!hideUsernameReset && (
            <section className="pt-4 border-t border-gray-500/20">
              <button 
                onClick={() => onUpdate({userName: null})}
                className={`text-sm w-full font-medium ${config.textMuted} hover:opacity-80 transition-all`}
              >
                Reset Username
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
