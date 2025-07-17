export interface ColorPreset {
  name: string;
  color: string;
  gradient: string;
}

export const PRESET_COLORS: ColorPreset[] = [
  { name: 'Slate', color: '#64748b', gradient: 'from-slate-400 to-slate-600' },
  { name: 'Red', color: '#ef4444', gradient: 'from-red-400 to-red-600' },
  {
    name: 'Orange',
    color: '#f97316',
    gradient: 'from-orange-400 to-orange-600',
  },
  { name: 'Amber', color: '#f59e0b', gradient: 'from-amber-400 to-amber-600' },
  {
    name: 'Yellow',
    color: '#eab308',
    gradient: 'from-yellow-400 to-yellow-600',
  },
  { name: 'Lime', color: '#84cc16', gradient: 'from-lime-400 to-lime-600' },
  { name: 'Green', color: '#22c55e', gradient: 'from-green-400 to-green-600' },
  {
    name: 'Emerald',
    color: '#10b981',
    gradient: 'from-emerald-400 to-emerald-600',
  },
  { name: 'Teal', color: '#14b8a6', gradient: 'from-teal-400 to-teal-600' },
  { name: 'Cyan', color: '#06b6d4', gradient: 'from-cyan-400 to-cyan-600' },
  { name: 'Sky', color: '#0ea5e9', gradient: 'from-sky-400 to-sky-600' },
  { name: 'Blue', color: '#3b82f6', gradient: 'from-blue-400 to-blue-600' },
  {
    name: 'Indigo',
    color: '#6366f1',
    gradient: 'from-indigo-400 to-indigo-600',
  },
  {
    name: 'Violet',
    color: '#8b5cf6',
    gradient: 'from-violet-400 to-violet-600',
  },
  {
    name: 'Purple',
    color: '#a855f7',
    gradient: 'from-purple-400 to-purple-600',
  },
  {
    name: 'Fuchsia',
    color: '#d946ef',
    gradient: 'from-fuchsia-400 to-fuchsia-600',
  },
  { name: 'Pink', color: '#ec4899', gradient: 'from-pink-400 to-pink-600' },
  { name: 'Rose', color: '#f43f5e', gradient: 'from-rose-400 to-rose-600' },
];

export const generateRandomColor = (): string => {
  const randomIndex = Math.floor(Math.random() * PRESET_COLORS.length);
  return PRESET_COLORS[randomIndex].color;
};

export const generateRandomColorWithGradient = (): ColorPreset => {
  const randomIndex = Math.floor(Math.random() * PRESET_COLORS.length);
  return PRESET_COLORS[randomIndex];
};

export const getColorByName = (name: string): ColorPreset | undefined => {
  return PRESET_COLORS.find(
    (preset) => preset.name.toLowerCase() === name.toLowerCase()
  );
};
