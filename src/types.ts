export interface Habit {
  id: string
  name: string
  color: string
  icon: string
  createdAt: string
  archived: boolean
}

export interface DayEntry {
  date: string // YYYY-MM-DD
  habitId: string
  completed: boolean
}

export interface HabitStats {
  currentStreak: number
  longestStreak: number
  totalCompletions: number
  completionRate: number
  last30Days: number
}

export const COLORS = [
  { name: 'Green', value: '#22c55e', shades: ['#14532d', '#166534', '#15803d', '#22c55e'] },
  { name: 'Blue', value: '#3b82f6', shades: ['#1e3a5f', '#1d4ed8', '#2563eb', '#3b82f6'] },
  { name: 'Purple', value: '#a855f7', shades: ['#3b0764', '#6b21a8', '#7c3aed', '#a855f7'] },
  { name: 'Orange', value: '#f97316', shades: ['#431407', '#9a3412', '#c2410c', '#f97316'] },
  { name: 'Pink', value: '#ec4899', shades: ['#500724', '#9d174d', '#be185d', '#ec4899'] },
  { name: 'Cyan', value: '#06b6d4', shades: ['#083344', '#0e7490', '#0891b2', '#06b6d4'] },
  { name: 'Yellow', value: '#eab308', shades: ['#422006', '#854d0e', '#a16207', '#eab308'] },
  { name: 'Red', value: '#ef4444', shades: ['#450a0a', '#991b1b', '#b91c1c', '#ef4444'] },
]

export const ICONS = ['⚡', '💪', '📚', '🏃', '💧', '🧘', '✍️', '🎯', '💤', '🥗', '🎨', '🎵', '💊', '🧹', '🌱', '⏰']
