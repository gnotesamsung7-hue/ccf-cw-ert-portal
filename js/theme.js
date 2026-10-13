// Tailwind theme shared by every page (same palette as the original command portal)
window.tailwind = window.tailwind || {};
tailwind.config = {
  darkMode: 'class',
  theme: { extend: { colors: {
    darkBg: '#090d16', cardBg: '#111827', cardBorder: '#1f2937',
    accentRed: '#ef4444', accentAmber: '#f59e0b', accentBlue: '#3b82f6', tacticalSlate: '#1e293b'
  } } }
};
