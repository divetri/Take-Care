import { ThemeType } from './types';

export const getThemeConfig = (theme: ThemeType) => {
  switch (theme) {
    case 'light':
      return {
        bgMain: 'bg-white',
        bgSurface: 'bg-gray-50',
        textMain: 'text-gray-900',
        textMuted: 'text-gray-500',
        border: 'border-gray-200',
        accentBg: 'bg-blue-100',
        accentText: 'text-blue-600',
        buttonPrimaryBg: 'bg-gray-900',
        buttonPrimaryText: 'text-white',
        buttonPrimaryHover: 'hover:bg-gray-800',
        selection: 'selection:bg-blue-500/30'
      };
    case 'pastel':
      return {
        bgMain: 'bg-[#F5DCE0]',
        bgSurface: 'bg-[#EFCFD4]',
        textMain: 'text-[#5a3243]',
        textMuted: 'text-[#906a78]',
        border: 'border-[#ECBDC4]',
        accentBg: 'bg-[#E4A0B7]',
        accentText: 'text-white',
        buttonPrimaryBg: 'bg-[#E18AAA]',
        buttonPrimaryText: 'text-white',
        buttonPrimaryHover: 'hover:brightness-95',
        selection: 'selection:bg-[#E4A0B7]/50'
      };
    case 'neon':
      return {
        bgMain: 'bg-[#1e3829]',
        bgSurface: 'bg-[#3a291b]',
        textMain: 'text-[#c0ff30]',
        textMuted: 'text-[#309dff]',
        border: 'border-[#ff3096]',
        accentBg: 'bg-[#ff3096]/20',
        accentText: 'text-[#ff3096]',
        buttonPrimaryBg: 'bg-[#ff3096]',
        buttonPrimaryText: 'text-white',
        buttonPrimaryHover: 'hover:brightness-110',
        selection: 'selection:bg-[#ff3096]/50'
      };
    case 'dark':
    default:
      return {
        bgMain: 'bg-gray-950',
        bgSurface: 'bg-gray-900',
        textMain: 'text-white',
        textMuted: 'text-gray-400',
        border: 'border-gray-800',
        accentBg: 'bg-blue-500/20',
        accentText: 'text-blue-400',
        buttonPrimaryBg: 'bg-white',
        buttonPrimaryText: 'text-black',
        buttonPrimaryHover: 'hover:bg-gray-200',
        selection: 'selection:bg-blue-500/30'
      };
  }
};
