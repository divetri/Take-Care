import React, { useState, useEffect, useRef } from 'react';
import { AppState, Coordinates, AppSettings, ThemeType, AlarmTriggerType, TrackingMilestone } from './types';
import { SetupScreen } from './components/SetupScreen';
import { TrackingScreen } from './components/TrackingScreen';
import { AlarmScreen } from './components/AlarmScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { SplashScreen } from './components/SplashScreen';
import { PreSplashScreen } from './components/PreSplashScreen';
import { NameInputScreen } from './components/NameInputScreen';
import { getDistance, startAlarmAudio, stopAlarmAudio } from './utils';
import { getThemeConfig } from './themeConfig';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  alarmMode: 'ring-vibrate',
  soundPreset: 'gentle',
  customSoundUrl: null,
  userName: null
};

export default function App() {
  const [appState, setAppState] = useState<AppState>('SETUP');
  const [destination, setDestination] = useState<Coordinates | null>(null);
  const [targetStationName, setTargetStationName] = useState<string | null>(null);
  const [triggerType, setTriggerType] = useState<AlarmTriggerType>('arrive');
  const [originalDestName, setOriginalDestName] = useState<string | null>(null);
  const [radius, setRadius] = useState<number>(100);
  const [currentPos, setCurrentPos] = useState<Coordinates | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [showPreSplash, setShowPreSplash] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  // persistent user selections
  const [initialStation, setInitialStation] = useState<string>('');
  const [destinationStation, setDestinationStation] = useState<string>('');
  const [trigger, setTrigger] = useState<AlarmTriggerType>('arrive');

  // Alarm sequence tracking states
  const [milestones, setMilestones] = useState<TrackingMilestone[]>([]);
  const [currentMilestoneIndex, setCurrentMilestoneIndex] = useState<number>(0);

  const activeMilestone = milestones[currentMilestoneIndex] || null;
  const activeDestination = activeMilestone ? activeMilestone.coordinates : destination;
  const activeTargetName = activeMilestone ? activeMilestone.stationName : targetStationName;
  const activeTriggerType = activeMilestone ? activeMilestone.triggerType : triggerType;
  const activeOriginalDestName = activeMilestone ? activeMilestone.originalDestName : originalDestName;

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('krl-alarm-settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('krl-alarm-settings', JSON.stringify(settings));
  }, [settings]);

  // Handle splash visibility on boot
  useEffect(() => {
    if (settings.userName) {
       setShowPreSplash(false);
       // If reloading and we already have a name, do we show splash?
       // Usually if they reload we just skip splash or let it run. We can let it run.
    }
  }, []);

  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [pathCoords, setPathCoords] = useState<Coordinates[]>([]);
  const simProgressRef = useRef(0);
  const watchIdRef = useRef<number | null>(null);
  const simIntervalRef = useRef<number | null>(null);

  // Initial location to center map
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setCurrentPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.error("Could not get initial pos:", err),
      { enableHighAccuracy: true }
    );
  }, []);

  // Tracking Logic (Real GPS)
  useEffect(() => {
    if (appState === 'TRACKING' && activeDestination && !isSimulating) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCurrentPos(newPos);
          
          const dist = getDistance(newPos.lat, newPos.lng, activeDestination.lat, activeDestination.lng);
          setDistance(dist);
          
          const targetRadius = (activeMilestone && activeMilestone.isTransit) ? 100 : radius;
          if (dist <= targetRadius) {
            setAppState('ALARM');
            startAlarmAudio(settings);
          }
        },
        (err) => {
          console.error("GPS Error:", err);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [appState, activeDestination, radius, activeMilestone, isSimulating, settings]);

  // Tracking Logic (Simulation)
  useEffect(() => {
    if (appState === 'TRACKING' && activeDestination && isSimulating && pathCoords.length > 0) {
      
      const interpolatePosition = (p1: Coordinates, p2: Coordinates, fraction: number) => {
        if (!p1) return p2 || {lat: 0, lng: 0};
        if (!p2) return p1;
        return {
          lat: p1.lat + (p2.lat - p1.lat) * fraction,
          lng: p1.lng + (p2.lng - p1.lng) * fraction
        };
      };

      const pathLength = pathCoords.length;

      simIntervalRef.current = window.setInterval(() => {
        simProgressRef.current += 0.02; // speed

        let pathIndex = Math.floor(simProgressRef.current);
        let fraction = simProgressRef.current - pathIndex;

        if (pathIndex >= pathLength - 1) {
          pathIndex = pathLength - 2;
          fraction = 1;
        }

        const newPos = interpolatePosition(pathCoords[pathIndex], pathCoords[pathIndex + 1], fraction);
        setCurrentPos(newPos);

        const dist = getDistance(newPos.lat, newPos.lng, activeDestination.lat, activeDestination.lng);
        setDistance(dist);

        const targetRadius = (activeMilestone && activeMilestone.isTransit) ? 100 : radius;
        if (dist <= targetRadius) {
          setAppState('ALARM');
          startAlarmAudio(settings);
          if (simIntervalRef.current) clearInterval(simIntervalRef.current);
        }
      }, 100); // Fast update for smooth simulation
    }

    return () => {
      if (simIntervalRef.current !== null) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
    };
  }, [appState, activeDestination, radius, activeMilestone, isSimulating, pathCoords, settings]);

  // Cleanup Alarm on exit
  useEffect(() => {
    if (appState !== 'ALARM') {
      stopAlarmAudio();
    }
  }, [appState]);

  const handleStartTracking = (dest: Coordinates, rad: number, isSim: boolean, trigger: AlarmTriggerType, origDestName: string, coordsToSimulate?: Coordinates[], targetName?: string, routeMilestones?: TrackingMilestone[]) => {
    setDestination(dest);
    setRadius(rad);
    setTriggerType(trigger);
    setOriginalDestName(origDestName);
    setTargetStationName(targetName || "Destination");
    setIsSimulating(isSim);
    if (isSim && coordsToSimulate) {
      setPathCoords(coordsToSimulate);
      setCurrentPos(coordsToSimulate[0]);
    }

    if (routeMilestones && routeMilestones.length > 0) {
      setMilestones(routeMilestones);
    } else {
      setMilestones([{
        stationName: targetName || "Destination",
        coordinates: dest,
        isTransit: false,
        triggerType: trigger,
        originalDestName: origDestName
      }]);
    }
    setCurrentMilestoneIndex(0);
    simProgressRef.current = 0; // Only reset here
    
    // Silent play to unlock AudioContext on iOS/Android
    startAlarmAudio({...settings, alarmMode: 'ring', soundPreset: 'gentle'}); // Just wake up context
    setTimeout(stopAlarmAudio, 50); 
    
    setAppState('TRACKING');
    setDistance(null);
  };

  const handleCancelTracking = () => {
    setAppState('SETUP');
    setDistance(null);
    setIsSimulating(false);
  };

  const handleStopAlarm = () => {
    if (currentMilestoneIndex < milestones.length - 1) {
      setCurrentMilestoneIndex(prev => prev + 1);
      setAppState('TRACKING');
    } else {
      setAppState('SETUP');
      setDistance(null);
      setDestination(null);
      setIsSimulating(false);
    }
  };

  const updateSettings = (updates: Partial<AppSettings>) => {
     setSettings(prev => ({...prev, ...updates}));
  };

  const themeConfig = getThemeConfig(settings.theme);

  if (showPreSplash && !settings.userName) {
    return <PreSplashScreen theme={settings.theme} onDone={() => setShowPreSplash(false)} />;
  }

  if (!settings.userName) {
    return <NameInputScreen theme={settings.theme} onSave={(name) => updateSettings({userName: name})} />;
  }

  if (showSplash) {
    return <SplashScreen userName={settings.userName} theme={settings.theme} onDone={() => setShowSplash(false)} />;
  }

  return (
    <main className={`w-full h-screen font-sans ${themeConfig.bgMain} transition-colors duration-300`}>
      {appState === 'SETUP' && (
        <SetupScreen 
          onStartTracking={handleStartTracking}
          currentPos={currentPos}
          onOpenSettings={() => setShowSettings(true)}
          theme={settings.theme}
          userName={settings.userName!}
          initialStation={initialStation}
          setInitialStation={setInitialStation}
          destinationStation={destinationStation}
          setDestinationStation={setDestinationStation}
          trigger={trigger}
          setTrigger={setTrigger}
        />
      )}
      
      {appState === 'TRACKING' && (
        <TrackingScreen 
          distance={distance} 
          radius={(activeMilestone && activeMilestone.isTransit) ? 100 : radius} 
          targetStationName={activeTargetName}
          originalDestinationName={activeOriginalDestName}
          triggerType={activeTriggerType}
          onCancel={handleCancelTracking} 
          theme={settings.theme}
        />
      )}
      
      {appState === 'ALARM' && (
        <AlarmScreen 
          onStop={handleStopAlarm} 
          theme={settings.theme} 
          userName={settings.userName} 
          stationName={activeTargetName}
          isTransit={activeMilestone?.isTransit}
        />
      )}

      {showSettings && (
        <SettingsScreen 
          settings={settings}
          onUpdate={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </main>
  );
}

