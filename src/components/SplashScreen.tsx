import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeType } from '../types';
import { getThemeConfig } from '../themeConfig';

export function SplashScreen({ userName, theme, onDone }: { userName: string, theme: ThemeType, onDone: () => void }) {
  const config = getThemeConfig(theme);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setStep(1), 1500); // Wait 1.5s then show greeting
    const timer2 = setTimeout(onDone, 4000); // 4 seconds total
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onDone]);

  return (
    <div className={`flex flex-col h-screen items-center justify-center ${config.bgMain} ${config.textMain} ${config.selection}`}>
      <div className="relative flex items-center justify-center w-full h-[200px]">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.h1
              key="step0"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center text-4xl sm:text-5xl font-bold tracking-tight absolute"
            >
              Take<br/>Care
            </motion.h1>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center px-6 text-2xl font-light absolute"
            >
              hello, {userName}! <br/><br/>
              let me <b className={`${config.textMain} font-bold`}>take care</b> of your trip.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
