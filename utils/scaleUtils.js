/**
 * utils/scaleUtils.js
 *
 * Shared utilities for the Scale Converter.
 * Pure functions only - no storage, no accounts.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const MAX_ENTRIES = 10
export const UNITS = ['mm', 'cm', 'in', 'ft']
export const DEFAULT_UNIT = 'cm'

// ---------------------------------------------------------------------------
// Unit conversion (millimeters as internal base)
// ---------------------------------------------------------------------------

export function toMM(value, unit) {
  switch (unit) {
    case 'mm': return value
    case 'cm': return value * 10
    case 'in': return value * 25.4
    case 'ft': return value * 304.8
    default:   return value
  }
}

export function fromMM(mm, unit) {
  switch (unit) {
    case 'mm': return mm
    case 'cm': return mm / 10
    case 'in': return mm / 25.4
    case 'ft': return mm / 304.8
    default:   return mm
  }
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function fmt(n, decimals = 4) {
  if (n === null || n === undefined || isNaN(n)) return '—'
  return parseFloat(n.toFixed(decimals)).toString()
}

// ---------------------------------------------------------------------------
// Scale parsing
// ---------------------------------------------------------------------------

/**
 * Parse a scale string. Accepts:
 *   - Decimal multiplier: "0.172"
 *   - Ratio: "1:5.8125"
 * Returns the decimal multiplier or null if invalid.
 */
export function parseScale(input) {
  if (!input || input.trim() === '') return null
  const trimmed = input.trim()

  // Ratio format "1:X"
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':')
    if (parts.length === 2) {
      const denominator = parseFloat(parts[1])
      if (!isNaN(denominator) && denominator > 0) {
        return 1 / denominator
      }
    }
    return null
  }

  // Decimal multiplier
  const num = parseFloat(trimmed)
  if (!isNaN(num) && num > 0 && num <= 1) return num
  return null
}

/** Convert a decimal multiplier to a readable ratio string. */
export function multiplierToRatio(m) {
  if (!m || m <= 0) return '—'
  return `1:${fmt(1 / m, 4)}`
}

// ---------------------------------------------------------------------------
// Project data helpers
// ---------------------------------------------------------------------------

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export function blankEntry() {
  return { id: uid(), label: '', value: '', unit: DEFAULT_UNIT }
}

export function blankProject() {
  return {
    id: uid(),
    name: '',
    scaleInput: '',
    multiplier: null,
    entries: [blankEntry()],
  }
}

// ---------------------------------------------------------------------------
// CSV generation
// ---------------------------------------------------------------------------

export function generateCSV(project) {
  const rows = [
    ['Project', project.name],
    ['Scale Input', project.scaleInput],
    ['Multiplier', fmt(project.multiplier, 6)],
    ['Ratio', multiplierToRatio(project.multiplier)],
    [],
    ['#', 'Label', 'Real-World Value', 'Unit', 'Scaled Value', 'Unit'],
  ]

  project.entries.forEach((entry, i) => {
    const v = parseFloat(entry.value)
    let scaled = ''
    if (!isNaN(v) && v > 0 && project.multiplier) {
      const realMM = toMM(v, entry.unit)
      const scaledMM = realMM * project.multiplier
      scaled = fmt(fromMM(scaledMM, entry.unit))
    }
    rows.push([i + 1, entry.label, entry.value, entry.unit, scaled, entry.unit])
  })

  return rows.map((r) => r.map((cell) => `"${cell}"`).join(',')).join('\n')
}

/** Safe filename for an exported project. */
export function csvFileName(project) {
  const base = (project.name || 'scale_project').replace(/[^a-zA-Z0-9]/g, '_')
  return `${base}_scale.csv`
}