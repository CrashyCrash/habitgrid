import { useState, useCallback } from 'react'
import { Habit, DayEntry, COLORS, ICONS } from './types'
import {
  loadHabits, saveHabits, loadEntries, saveEntries,
  toggleDay, isCompleted, getStats, formatDate,
  getDaysInRange, getWeekDay, exportData, importData,
} from './storage'
import {
  Plus, Trash2, Download, Upload, Flame, Trophy,
  Calendar, TrendingUp, BarChart3, X, Archive, RotateCcw,
  Heart, Coffee,
} from 'lucide-react'

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export default function App() {
  const [habits, setHabits] = useState<Habit[]>(loadHabits)
  const [entries, setEntries] = useState<DayEntry[]>(loadEntries)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null)

  const activeHabits = habits.filter(h => !h.archived)

  const updateHabits = useCallback((next: Habit[]) => {
    setHabits(next)
    saveHabits(next)
  }, [])

  const updateEntries = useCallback((next: DayEntry[]) => {
    setEntries(next)
    saveEntries(next)
  }, [])

  const handleToggle = useCallback((habitId: string, date: string) => {
    updateEntries(toggleDay(entries, habitId, date))
  }, [entries, updateEntries])

  const addHabit = useCallback((name: string, color: string, icon: string) => {
    const habit: Habit = {
      id: generateId(),
      name,
      color,
      icon,
      createdAt: formatDate(new Date()),
      archived: false,
    }
    updateHabits([...habits, habit])
    setShowAdd(false)
  }, [habits, updateHabits])

  const archiveHabit = useCallback((id: string) => {
    updateHabits(habits.map(h => h.id === id ? { ...h, archived: true } : h))
    if (selectedHabit === id) setSelectedHabit(null)
  }, [habits, selectedHabit, updateHabits])

  const restoreHabit = useCallback((id: string) => {
    updateHabits(habits.map(h => h.id === id ? { ...h, archived: false } : h))
  }, [habits, updateHabits])

  const deleteHabit = useCallback((id: string) => {
    updateHabits(habits.filter(h => h.id !== id))
    updateEntries(entries.filter(e => e.habitId !== id))
    if (selectedHabit === id) setSelectedHabit(null)
  }, [habits, entries, selectedHabit, updateHabits, updateEntries])

  const handleExport = useCallback(() => {
    const data = exportData(habits, entries)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `habitgrid-backup-${formatDate(new Date())}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [habits, entries])

  const handleImport = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const result = importData(reader.result as string)
        if (result) {
          updateHabits(result.habits)
          updateEntries(result.entries)
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }, [updateHabits, updateEntries])

  // Today's completions
  const today = formatDate(new Date())
  const todayCompleted = activeHabits.filter(h => isCompleted(entries, h.id, today)).length
  const todayTotal = activeHabits.length

  // Total stats
  const totalCurrentStreak = activeHabits.reduce((max, h) => {
    const s = getStats(entries, h.id, h.createdAt)
    return Math.max(max, s.currentStreak)
  }, 0)

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#ffffff0a] bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center border border-green-500/20">
              <BarChart3 className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">HabitGrid</h1>
              <p className="text-xs text-[#8888a0]">Visual Habit Tracker</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleImport} className="p-2 rounded-lg text-[#8888a0] hover:text-white hover:bg-[#ffffff08] transition-all" title="Import data">
              <Upload className="w-4 h-4" />
            </button>
            <button onClick={handleExport} className="p-2 rounded-lg text-[#8888a0] hover:text-white hover:bg-[#ffffff08] transition-all" title="Export data">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={() => setShowAdd(true)} className="btn-primary px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Habit
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* Stats Bar */}
        {activeHabits.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 fade-in">
            <StatCard icon={<Calendar className="w-4 h-4" />} label="Today" value={`${todayCompleted}/${todayTotal}`} color={todayCompleted === todayTotal && todayTotal > 0 ? 'text-green-400' : 'text-white'} />
            <StatCard icon={<Flame className="w-4 h-4" />} label="Best Streak" value={`${totalCurrentStreak}d`} color="text-orange-400" />
            <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Total Tracked" value={`${entries.length}`} color="text-blue-400" />
            <StatCard icon={<Trophy className="w-4 h-4" />} label="Active Habits" value={`${activeHabits.length}`} color="text-purple-400" />
          </div>
        )}

        {/* Empty State */}
        {activeHabits.length === 0 && (
          <div className="glass-card rounded-2xl p-12 text-center fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-500/10 flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Start Tracking Your Habits</h2>
            <p className="text-[#8888a0] mb-6 max-w-md mx-auto">
              Build consistency with beautiful GitHub-style contribution grids. 
              Your data stays on your device — private and offline-ready.
            </p>
            <button onClick={() => setShowAdd(true)} className="btn-primary px-6 py-3 rounded-xl text-sm font-medium text-white inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create Your First Habit
            </button>
          </div>
        )}

        {/* Habit Grids */}
        {activeHabits.map(habit => (
          <HabitGrid
            key={habit.id}
            habit={habit}
            entries={entries}
            isSelected={selectedHabit === habit.id}
            onSelect={() => setSelectedHabit(selectedHabit === habit.id ? null : habit.id)}
            onToggle={handleToggle}
            onArchive={archiveHabit}
            onDelete={deleteHabit}
            tooltip={tooltip}
            setTooltip={setTooltip}
          />
        ))}

        {/* Archived Habits */}
        {habits.some(h => h.archived) && (
          <ArchivedSection
            habits={habits.filter(h => h.archived)}
            onRestore={restoreHabit}
            onDelete={deleteHabit}
          />
        )}
      </main>

      {/* Footer with Revenue Links */}
      <footer className="border-t border-[#ffffff08] mt-12 py-8 text-center">
        <div className="mx-auto max-w-6xl px-4 space-y-4">
          <p className="text-[#555570] text-sm">
            Built with ❤️ by <a href="https://github.com/CrashyCrash" className="text-green-400/80 hover:text-green-400 transition-colors" target="_blank" rel="noopener noreferrer">CrashyCrash</a>
            &nbsp;· Powered by <a href="https://github.com/CrashyCrash/datbotty-hub" className="text-green-400/80 hover:text-green-400 transition-colors" target="_blank" rel="noopener noreferrer">DatBotty AI</a>
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="https://www.buymeacoffee.com/crashycrash"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FFDD00]/10 border border-[#FFDD00]/20 text-[#FFDD00] hover:bg-[#FFDD00]/20 transition-all text-sm font-medium"
            >
              <Coffee className="w-4 h-4" /> Buy Me a Coffee
            </a>
            <a
              href="https://github.com/sponsors/CrashyCrash"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 hover:bg-pink-500/20 transition-all text-sm font-medium"
            >
              <Heart className="w-4 h-4" /> Sponsor
            </a>
          </div>
          <p className="text-[#555570] text-xs">
            Your data never leaves your device · 100% private · Works offline
          </p>
        </div>
      </footer>

      {/* Tooltip */}
      {tooltip && (
        <div className="tooltip" style={{ left: tooltip.x, top: tooltip.y - 40 }}>
          {tooltip.text}
        </div>
      )}

      {/* Add Habit Modal */}
      {showAdd && <AddHabitModal onAdd={addHabit} onClose={() => setShowAdd(false)} />}
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[#8888a0]">{icon}</span>
        <span className="text-xs text-[#8888a0]">{label}</span>
      </div>
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
    </div>
  )
}

function HabitGrid({
  habit, entries, isSelected, onSelect, onToggle, onArchive, onDelete, setTooltip,
}: {
  habit: Habit
  entries: DayEntry[]
  isSelected: boolean
  onSelect: () => void
  onToggle: (habitId: string, date: string) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  tooltip: { x: number; y: number; text: string } | null
  setTooltip: (t: { x: number; y: number; text: string } | null) => void
}) {
  const stats = getStats(entries, habit.id, habit.createdAt)
  const colorObj = COLORS.find(c => c.value === habit.color) || COLORS[0]

  // Generate 365 days of data (52 weeks + current week)
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - 364)
  // Align to Sunday
  startDate.setDate(startDate.getDate() - startDate.getDay())
  const days = getDaysInRange(startDate, today)

  // Build weeks grid
  const weeks: string[][] = []
  let currentWeek: string[] = []
  for (const day of days) {
    const dow = getWeekDay(day)
    if (dow === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek)
      currentWeek = []
    }
    currentWeek.push(day)
  }
  if (currentWeek.length > 0) weeks.push(currentWeek)

  const getLevel = (date: string) => {
    if (!isCompleted(entries, habit.id, date)) return 0
    // Check consecutive completions for intensity
    const d = new Date(date + 'T12:00:00')
    let streak = 1
    for (let i = 1; i <= 3; i++) {
      const prev = new Date(d)
      prev.setDate(prev.getDate() - i)
      if (isCompleted(entries, habit.id, formatDate(prev))) streak++
      else break
    }
    return Math.min(streak, 4)
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthLabels: { label: string; col: number }[] = []
  let lastMonth = -1
  weeks.forEach((week, i) => {
    const d = new Date(week[0] + 'T12:00:00')
    if (d.getMonth() !== lastMonth) {
      monthLabels.push({ label: months[d.getMonth()], col: i })
      lastMonth = d.getMonth()
    }
  })

  return (
    <div className={`glass-card rounded-2xl overflow-hidden fade-in transition-all ${isSelected ? 'ring-1 ring-white/10' : ''}`}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between cursor-pointer" onClick={onSelect}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{habit.icon}</span>
          <div>
            <h3 className="font-semibold text-white">{habit.name}</h3>
            <div className="flex items-center gap-3 mt-0.5">
              {stats.currentStreak > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-orange-400">
                  <Flame className="w-3 h-3" /> {stats.currentStreak} day streak
                </span>
              )}
              <span className="text-xs text-[#8888a0]">{stats.completionRate}% completion</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Today toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(habit.id, formatDate(new Date())) }}
            className={`w-10 h-10 rounded-xl border-2 transition-all flex items-center justify-center text-lg ${
              isCompleted(entries, habit.id, formatDate(new Date()))
                ? 'border-transparent text-white'
                : 'border-dashed border-[#ffffff20] text-[#555570] hover:border-[#ffffff40]'
            }`}
            style={isCompleted(entries, habit.id, formatDate(new Date())) ? { backgroundColor: habit.color } : {}}
            title="Toggle today"
          >
            {isCompleted(entries, habit.id, formatDate(new Date())) ? '✓' : ''}
          </button>
        </div>
      </div>

      {/* Contribution Grid */}
      <div className="px-4 pb-4 overflow-x-auto">
        <div className="min-w-[720px]">
          {/* Month labels */}
          <div className="flex gap-0 mb-1 ml-8">
            {monthLabels.map((m, i) => (
              <div
                key={i}
                className="text-[10px] text-[#555570]"
                style={{ position: 'relative', left: m.col * 14 - (i > 0 ? monthLabels[i - 1].col * 14 + (monthLabels[i - 1].label.length * 6) : 0) }}
              >
                {m.label}
              </div>
            ))}
          </div>
          <div className="flex gap-0">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] mr-2 py-0">
              {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((d, i) => (
                <div key={i} className="h-[12px] text-[10px] text-[#555570] leading-[12px]">{d}</div>
              ))}
            </div>
            {/* Grid */}
            <div className="flex gap-[3px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {[0, 1, 2, 3, 4, 5, 6].map(dow => {
                    const day = week.find(d => getWeekDay(d) === dow)
                    if (!day) return <div key={dow} className="w-[12px] h-[12px]" />
                    const level = getLevel(day)
                    const bg = level === 0 ? '#ffffff08' : colorObj.shades[level - 1]
                    const todayStr = formatDate(new Date())
                    const isToday = day === todayStr
                    return (
                      <div
                        key={dow}
                        className={`habit-cell w-[12px] h-[12px] ${isToday ? 'ring-1 ring-white/30' : ''}`}
                        style={{ backgroundColor: bg, color: bg }}
                        onClick={() => onToggle(habit.id, day)}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect()
                          const d = new Date(day + 'T12:00:00')
                          const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                          const status = isCompleted(entries, habit.id, day) ? '✓ Completed' : 'Not done'
                          setTooltip({ x: rect.left + rect.width / 2, y: rect.top, text: `${label} · ${status}` })
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-2 mt-2 ml-8">
            <span className="text-[10px] text-[#555570]">Less</span>
            <div className="w-[12px] h-[12px] rounded-sm" style={{ backgroundColor: '#ffffff08' }} />
            {colorObj.shades.map((s, i) => (
              <div key={i} className="w-[12px] h-[12px] rounded-sm" style={{ backgroundColor: s }} />
            ))}
            <span className="text-[10px] text-[#555570]">More</span>
          </div>
        </div>
      </div>

      {/* Expanded Stats */}
      {isSelected && (
        <div className="border-t border-[#ffffff08] p-4 fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <MiniStat label="Current Streak" value={`${stats.currentStreak} days`} />
            <MiniStat label="Longest Streak" value={`${stats.longestStreak} days`} />
            <MiniStat label="Last 30 Days" value={`${stats.last30Days}/30`} />
            <MiniStat label="Total" value={`${stats.totalCompletions}`} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => onArchive(habit.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-[#8888a0] hover:text-yellow-400 hover:bg-yellow-400/10 transition-all">
              <Archive className="w-3 h-3" /> Archive
            </button>
            <button onClick={() => { if (confirm('Delete this habit and all its data?')) onDelete(habit.id) }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-[#8888a0] hover:text-red-400 hover:bg-red-400/10 transition-all">
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#ffffff04] rounded-lg p-3">
      <div className="text-[10px] text-[#555570] uppercase tracking-wider">{label}</div>
      <div className="text-sm font-semibold text-white mt-0.5">{value}</div>
    </div>
  )
}

function ArchivedSection({ habits, onRestore, onDelete }: { habits: Habit[]; onRestore: (id: string) => void; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="glass-card rounded-2xl p-4">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 text-sm text-[#8888a0] hover:text-white transition-colors w-full">
        <Archive className="w-4 h-4" />
        <span>Archived ({habits.length})</span>
      </button>
      {open && (
        <div className="mt-3 space-y-2 fade-in">
          {habits.map(h => (
            <div key={h.id} className="flex items-center justify-between bg-[#ffffff04] rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span>{h.icon}</span>
                <span className="text-sm text-[#8888a0]">{h.name}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => onRestore(h.id)} className="p-1.5 rounded text-[#8888a0] hover:text-green-400 hover:bg-green-400/10 transition-all" title="Restore">
                  <RotateCcw className="w-3 h-3" />
                </button>
                <button onClick={() => { if (confirm('Permanently delete?')) onDelete(h.id) }} className="p-1.5 rounded text-[#8888a0] hover:text-red-400 hover:bg-red-400/10 transition-all" title="Delete">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AddHabitModal({ onAdd, onClose }: { onAdd: (name: string, color: string, icon: string) => void; onClose: () => void }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0].value)
  const [icon, setIcon] = useState(ICONS[0])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) onAdd(name.trim(), color, icon)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop" onClick={onClose}>
      <div className="glass-card rounded-2xl p-6 w-full max-w-md mx-4 fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">New Habit</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-[#8888a0] hover:text-white hover:bg-[#ffffff08] transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs text-[#8888a0] uppercase tracking-wider block mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Exercise, Read, Meditate..."
              className="w-full px-4 py-3 rounded-xl bg-[#ffffff06] border border-[#ffffff0a] text-white placeholder-[#555570] focus:outline-none focus:border-green-500/40 focus:ring-1 focus:ring-green-500/20 transition-all"
              autoFocus
              maxLength={50}
            />
          </div>

          <div>
            <label className="text-xs text-[#8888a0] uppercase tracking-wider block mb-2">Icon</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map(i => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                    icon === i ? 'bg-[#ffffff15] ring-1 ring-white/20 scale-110' : 'bg-[#ffffff06] hover:bg-[#ffffff0a]'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-[#8888a0] uppercase tracking-wider block mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-10 h-10 rounded-xl transition-all ${
                    color === c.value ? 'ring-2 ring-white/30 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-[#ffffff04] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{icon}</span>
              <div>
                <span className="font-semibold text-white">{name || 'Your Habit'}</span>
                <div className="flex gap-1 mt-1">
                  {COLORS.find(c => c.value === color)?.shades.map((s, i) => (
                    <div key={i} className="w-4 h-4 rounded-sm" style={{ backgroundColor: s }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button type="submit" disabled={!name.trim()} className="btn-primary w-full py-3 rounded-xl text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed">
            Create Habit
          </button>
        </form>
      </div>
    </div>
  )
}
