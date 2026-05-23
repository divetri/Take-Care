import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { ThemeType } from '../types';
import { getThemeConfig } from '../themeConfig';

export function PreSplashScreen({ theme, onDone }: { theme: ThemeType, onDone: () => void }) {
  const config = getThemeConfig(theme);

  useEffect(() => {
    const timer = setTimeout(onDone, 2000); // 2 seconds
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className={`flex flex-col h-screen items-center justify-center ${config.bgMain} ${config.textMain} ${config.selection}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center px-6"
      >
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Take<br/>Care</h1>
      </motion.div>
    </div>
  );
}
