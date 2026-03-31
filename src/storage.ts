import { Habit, DayEntry, HabitStats } from './types'

const HABITS_KEY = 'habitgrid_habits'
const ENTRIES_KEY = 'habitgrid_entries'

export function loadHabits(): Habit[] {
  try {
    const raw = localStorage.getItem(HABITS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveHabits(habits: Habit[]) {
  localStorage.setItem(HABITS_KEY, JSON.stringify(habits))
}

export function loadEntries(): DayEntry[] {
  try {
    const raw = localStorage.getItem(ENTRIES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveEntries(entries: DayEntry[]) {
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries))
}

export function toggleDay(entries: DayEntry[], habitId: string, date: string): DayEntry[] {
  const idx = entries.findIndex(e => e.habitId === habitId && e.date === date)
  if (idx >= 0) {
    return entries.filter((_, i) => i !== idx)
  }
  return [...entries, { date, habitId, completed: true }]
}

export function isCompleted(entries: DayEntry[], habitId: string, date: string): boolean {
  return entries.some(e => e.habitId === habitId && e.date === date)
}

export function getStats(entries: DayEntry[], habitId: string, createdAt: string): HabitStats {
  const habitEntries = entries.filter(e => e.habitId === habitId)
  const dates = new Set(habitEntries.map(e => e.date))
  const today = new Date()
  
  // Current streak
  let currentStreak = 0
  const d = new Date(today)
  while (true) {
    const ds = formatDate(d)
    if (dates.has(ds)) {
      currentStreak++
      d.setDate(d.getDate() - 1)
    } else {
      break
    }
  }

  // Longest streak
  let longestStreak = 0
  let tempStreak = 0
  const sorted = Array.from(dates).sort()
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) {
      tempStreak = 1
    } else {
      const prev = new Date(sorted[i - 1])
      const curr = new Date(sorted[i])
      const diff = (curr.getTime() - prev.getTime()) / 86400000
      tempStreak = diff === 1 ? tempStreak + 1 : 1
    }
    longestStreak = Math.max(longestStreak, tempStreak)
  }

  // Last 30 days
  let last30 = 0
  for (let i = 0; i < 30; i++) {
    const dd = new Date(today)
    dd.setDate(dd.getDate() - i)
    if (dates.has(formatDate(dd))) last30++
  }

  // Completion rate
  const created = new Date(createdAt)
  const daysSinceCreation = Math.max(1, Math.floor((today.getTime() - created.getTime()) / 86400000) + 1)
  const rate = Math.round((habitEntries.length / daysSinceCreation) * 100)

  return {
    currentStreak,
    longestStreak,
    totalCompletions: habitEntries.length,
    completionRate: Math.min(100, rate),
    last30Days: last30,
  }
}

export function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

export function getDaysInRange(startDate: Date, endDate: Date): string[] {
  const days: string[] = []
  const d = new Date(startDate)
  while (d <= endDate) {
    days.push(formatDate(d))
    d.setDate(d.getDate() + 1)
  }
  return days
}

export function getWeekDay(dateStr: string): number {
  return new Date(dateStr + 'T12:00:00').getDay()
}

export function exportData(habits: Habit[], entries: DayEntry[]): string {
  return JSON.stringify({ habits, entries, exportedAt: new Date().toISOString(), version: 1 }, null, 2)
}

export function importData(json: string): { habits: Habit[]; entries: DayEntry[] } | null {
  try {
    const data = JSON.parse(json)
    if (Array.isArray(data.habits) && Array.isArray(data.entries)) {
      return { habits: data.habits, entries: data.entries }
    }
    return null
  } catch {
    return null
  }
}
