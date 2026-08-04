import { useState, useMemo } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  useColorScheme,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import Spacer from '../Components/Spacer'
import ThemedText from '../Components/ThemedText'
import ThemedView from '../Components/ThemedView'
import ThemedLogo from '../Components/ThemedLogo'

import {
  UNITS,
  DEFAULT_UNIT,
  MAX_ENTRIES,
  toMM,
  fromMM,
  fmt,
  parseScale,
  multiplierToRatio,
  blankEntry,
  blankProject,
} from '../utils/scaleUtils'
import { exportCSV } from '../utils/exportCsv'

// Widest the content is ever allowed to get. Without this the app stretches
// edge to edge on a desktop monitor and becomes unreadable.
const MAX_CONTENT_WIDTH = 720

// ---------------------------------------------------------------------------
// UnitPicker
// ---------------------------------------------------------------------------

function UnitPicker({ selected, onChange, isDark }) {
  return (
    <View style={styles.unitRow}>
      {UNITS.map((u) => (
        <TouchableOpacity
          key={u}
          style={[
            styles.unitBtn,
            { borderColor: isDark ? '#555' : '#ccc', backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' },
            selected === u && { backgroundColor: isDark ? '#ddd' : '#333', borderColor: isDark ? '#ddd' : '#333' },
          ]}
          onPress={() => onChange(u)}
        >
          <ThemedText style={[
            styles.unitBtnText,
            selected === u && { color: isDark ? '#111' : '#fff', fontWeight: '700' },
          ]}>
            {u.toUpperCase()}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  )
}

// ---------------------------------------------------------------------------
// ScaleCalculator (collapsible)
// ---------------------------------------------------------------------------

function ScaleCalculator({ onUseScale, isDark }) {
  const [open, setOpen] = useState(false)
  const [realValue, setRealValue] = useState('')
  const [realUnit, setRealUnit] = useState(DEFAULT_UNIT)
  const [modelValue, setModelValue] = useState('')
  const [modelUnit, setModelUnit] = useState(DEFAULT_UNIT)

  const inputStyle = [styles.input, isDark && styles.inputDark]

  const result = useMemo(() => {
    const rv = parseFloat(realValue)
    const mv = parseFloat(modelValue)
    if (isNaN(rv) || isNaN(mv) || rv <= 0 || mv <= 0) return null
    const realMM = toMM(rv, realUnit)
    const modelMM = toMM(mv, modelUnit)
    const multiplier = modelMM / realMM
    if (multiplier > 1 || multiplier <= 0) return null
    return multiplier
  }, [realValue, realUnit, modelValue, modelUnit])

  return (
    <View style={[styles.calcContainer, { borderColor: isDark ? '#444' : '#ddd' }]}>
      <TouchableOpacity
        onPress={() => setOpen(!open)}
        style={[styles.calcHeader, { backgroundColor: isDark ? '#1e1e1e' : '#f5f5f5' }]}
      >
        <ThemedText style={styles.calcHeaderText}>
          {open ? '▼' : '▶'}  Scale Calculator
        </ThemedText>
        <ThemedText style={styles.calcHeaderSub}>
          {open ? 'Determine your scale from known sizes' : 'Tap to expand'}
        </ThemedText>
      </TouchableOpacity>

      {open && (
        <View style={[styles.calcBody, { borderTopColor: isDark ? '#444' : '#eee' }]}>
          <ThemedText style={styles.fieldLabel}>Real-world size (1:1)</ThemedText>
          <View style={styles.inlineRow}>
            <TextInput
              style={[inputStyle, { flex: 1 }]}
              value={realValue}
              onChangeText={setRealValue}
              keyboardType="decimal-pad"
              placeholder="e.g. 158"
              placeholderTextColor={isDark ? '#777' : '#888'}
            />
            <UnitPicker selected={realUnit} onChange={setRealUnit} isDark={isDark} />
          </View>

          <ThemedText style={[styles.fieldLabel, { marginTop: 10 }]}>
            Actual model/body size
          </ThemedText>
          <View style={styles.inlineRow}>
            <TextInput
              style={[inputStyle, { flex: 1 }]}
              value={modelValue}
              onChangeText={setModelValue}
              keyboardType="decimal-pad"
              placeholder="e.g. 27"
              placeholderTextColor={isDark ? '#777' : '#888'}
            />
            <UnitPicker selected={modelUnit} onChange={setModelUnit} isDark={isDark} />
          </View>

          {result !== null && (
            <View style={[styles.calcResult, { backgroundColor: isDark ? '#1a2e1a' : '#f0f9f4' }]}>
              <ThemedText style={[styles.calcResultText, { color: isDark ? '#6ecf6e' : '#1a7' }]}>
                ×{fmt(result, 6)}   ({multiplierToRatio(result)})
              </ThemedText>
              <TouchableOpacity
                style={[styles.useScaleBtn, { backgroundColor: isDark ? '#ddd' : '#333' }]}
                onPress={() => onUseScale(result)}
              >
                <ThemedText style={{ color: isDark ? '#111' : '#fff', fontSize: 13, fontWeight: '600' }}>
                  Use This Scale
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  )
}

// ---------------------------------------------------------------------------
// EntryRow
// ---------------------------------------------------------------------------

function EntryRow({ entry, index, multiplier, onUpdate, onRemove, canRemove, isDark }) {
  const inputStyle = [styles.input, isDark && styles.inputDark]

  const scaledResult = useMemo(() => {
    const v = parseFloat(entry.value)
    if (isNaN(v) || v <= 0 || !multiplier) return null
    const realMM = toMM(v, entry.unit)
    const scaledMM = realMM * multiplier
    return fromMM(scaledMM, entry.unit)
  }, [entry.value, entry.unit, multiplier])

  return (
    <View style={[styles.entryRow, {
      borderColor: isDark ? '#444' : '#ddd',
      backgroundColor: isDark ? '#1a1a1a' : '#fafafa',
    }]}>
      <View style={styles.entryHeader}>
        <ThemedText style={styles.entryIndex}>#{index + 1}</ThemedText>
        {canRemove && (
          <TouchableOpacity onPress={onRemove} hitSlop={8}>
            <ThemedText style={styles.removeBtn}>✕</ThemedText>
          </TouchableOpacity>
        )}
      </View>

      <TextInput
        style={inputStyle}
        value={entry.label}
        onChangeText={(t) => onUpdate({ ...entry, label: t })}
        placeholder="Label (e.g. sword length)"
        placeholderTextColor={isDark ? '#777' : '#888'}
      />

      <View style={[styles.inlineRow, { marginTop: 6 }]}>
        <TextInput
          style={[inputStyle, { flex: 1 }]}
          value={entry.value}
          onChangeText={(t) => onUpdate({ ...entry, value: t })}
          keyboardType="decimal-pad"
          placeholder="Real-world size"
          placeholderTextColor={isDark ? '#777' : '#888'}
        />
        <UnitPicker
          selected={entry.unit}
          onChange={(u) => onUpdate({ ...entry, unit: u })}
          isDark={isDark}
        />
      </View>

      <View style={[styles.resultBox, { backgroundColor: isDark ? '#1a1a2e' : '#eef6ff' }]}>
        <ThemedText style={styles.resultLabel}>Scaled →</ThemedText>
        <ThemedText style={[styles.resultValue, { color: isDark ? '#7dacf7' : '#25e' }]}>
          {scaledResult !== null ? `${fmt(scaledResult)} ${entry.unit}` : '—'}
        </ThemedText>
      </View>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Calculator Screen
// ---------------------------------------------------------------------------

const Calculator = () => {
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const [project, setProject] = useState(blankProject())
  const [status, setStatus] = useState(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const isWide = width >= 768
  const logoSize = isWide ? 90 : 70

  // ---- Scale input ----

  const handleScaleInput = (text) => {
    const multiplier = parseScale(text)
    setProject((p) => ({ ...p, scaleInput: text, multiplier }))
    setStatus(null)
  }

  const handleUseCalculatedScale = (multiplier) => {
    const ratioStr = multiplierToRatio(multiplier)
    setProject((p) => ({ ...p, scaleInput: ratioStr, multiplier }))
    setStatus(null)
  }

  // ---- Entries ----

  const updateEntry = (idx, updated) => {
    setProject((p) => {
      const entries = [...p.entries]
      entries[idx] = updated
      return { ...p, entries }
    })
  }

  const addEntry = () => {
    if (project.entries.length >= MAX_ENTRIES) return
    setProject((p) => ({ ...p, entries: [...p.entries, blankEntry()] }))
  }

  const removeEntry = (idx) => {
    setProject((p) => ({
      ...p,
      entries: p.entries.filter((_, i) => i !== idx),
    }))
  }

  // ---- Export ----

  const handleExport = async () => {
    if (!project.multiplier) {
      setStatus({ type: 'error', text: 'Enter a valid scale before exporting.' })
      return
    }

    try {
      await exportCSV(project)
      setStatus({
        type: 'success',
        text: Platform.OS === 'web' ? 'CSV downloaded.' : 'CSV exported.',
      })
    } catch (e) {
      console.warn('Export failed', e)
      setStatus({ type: 'error', text: `Export failed. ${e.message || ''}`.trim() })
    }
  }

  // ---- Start over (two-tap confirm, so nothing is wiped by a stray tap) ----

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true)
      return
    }
    setProject(blankProject())
    setStatus(null)
    setConfirmReset(false)
  }

  // ---- Render ----

  const inputStyle = [styles.input, isDark && styles.inputDark]

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.contentWrap}>

          {/* Header */}
          <View style={styles.header}>
            <ThemedLogo style={{ width: logoSize, height: logoSize, resizeMode: 'contain' }} />
            <ThemedText title={true} style={[styles.heading, { fontSize: isWide ? 26 : 20 }]}>
              Scale Conversion Tool
            </ThemedText>
            <ThemedText style={styles.subheading}>The Real World in Miniature</ThemedText>
          </View>

          <Spacer height={10} />

          {/* Project name */}
          <ThemedText style={styles.fieldLabel}>Project Name</ThemedText>
          <ThemedText style={styles.fieldHint}>Used as the CSV file name when you export</ThemedText>
          <TextInput
            style={inputStyle}
            value={project.name}
            onChangeText={(t) => setProject((p) => ({ ...p, name: t }))}
            placeholder="e.g. Knight Figure"
            placeholderTextColor={isDark ? '#777' : '#888'}
          />

          {/* Scale Calculator */}
          <ScaleCalculator onUseScale={handleUseCalculatedScale} isDark={isDark} />

          {/* Custom scale input */}
          <ThemedText style={[styles.fieldLabel, { marginTop: 14 }]}>Custom Scale</ThemedText>
          <ThemedText style={styles.fieldHint}>
            Enter a decimal multiplier (e.g. 0.172) or ratio (e.g. 1:5.8125)
          </ThemedText>
          <TextInput
            style={inputStyle}
            value={project.scaleInput}
            onChangeText={handleScaleInput}
            placeholder="e.g. 1:6 or 0.1667"
            placeholderTextColor={isDark ? '#777' : '#888'}
          />
          {project.multiplier !== null && (
            <ThemedText style={[styles.scaleReadout, { color: isDark ? '#6ecf6e' : '#2a7' }]}>
              ×{fmt(project.multiplier, 6)}  ·  {multiplierToRatio(project.multiplier)}
            </ThemedText>
          )}
          {project.scaleInput.trim() !== '' && project.multiplier === null && (
            <ThemedText style={styles.scaleError}>
              Invalid scale. Use a decimal (0.172) or ratio (1:X).
            </ThemedText>
          )}

          {/* Entries header */}
          <View style={styles.entriesHeader}>
            <ThemedText style={styles.sectionTitle}>
              Entries ({project.entries.length}/{MAX_ENTRIES})
            </ThemedText>
            {project.entries.length < MAX_ENTRIES && (
              <TouchableOpacity onPress={addEntry}>
                <ThemedText style={[styles.addEntryBtn, { color: isDark ? '#6ecf6e' : '#2a7' }]}>
                  + Add Entry
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>

          {/* Entry rows */}
          {project.entries.map((entry, idx) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              index={idx}
              multiplier={project.multiplier}
              onUpdate={(updated) => updateEntry(idx, updated)}
              onRemove={() => removeEntry(idx)}
              canRemove={project.entries.length > 1}
              isDark={isDark}
            />
          ))}

          {/* Add entry button (bottom) */}
          {project.entries.length < MAX_ENTRIES && (
            <TouchableOpacity
              style={[styles.addEntryBtnLarge, { borderColor: isDark ? '#555' : '#ccc' }]}
              onPress={addEntry}
            >
              <ThemedText style={styles.addEntryBtnLargeText}>+ Add Entry</ThemedText>
            </TouchableOpacity>
          )}

          {/* Export */}
          <TouchableOpacity
            style={[styles.exportBtn, { backgroundColor: isDark ? '#ddd' : '#333' }]}
            onPress={handleExport}
          >
            <ThemedText style={{ color: isDark ? '#111' : '#fff', fontSize: 16, fontWeight: '600' }}>
              Export CSV
            </ThemedText>
          </TouchableOpacity>

          {status && (
            <ThemedText style={[
              styles.statusText,
              { color: status.type === 'error' ? '#c33' : (isDark ? '#6ecf6e' : '#2a7') },
            ]}>
              {status.text}
            </ThemedText>
          )}

          {/* Start over */}
          <TouchableOpacity
            style={[styles.resetBtn, { borderColor: confirmReset ? '#c33' : (isDark ? '#555' : '#ccc') }]}
            onPress={handleReset}
            onBlur={() => setConfirmReset(false)}
          >
            <ThemedText style={[
              styles.resetBtnText,
              confirmReset && { color: '#c33', opacity: 1 },
            ]}>
              {confirmReset ? 'Tap again to clear everything' : 'Start Over'}
            </ThemedText>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </ThemedView>
  )
}

export default Calculator

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  // Centers the column and stops it stretching across a wide monitor
  contentWrap: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },

  // Header
  header: {
    alignItems: 'center',
  },
  heading: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 4,
  },
  subheading: {
    fontSize: 13,
    opacity: 0.6,
    textAlign: 'center',
    marginTop: 2,
  },

  // Fields
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 6,
  },
  fieldHint: {
    fontSize: 11,
    opacity: 0.6,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 15,
    color: '#222',
    backgroundColor: '#fff',
  },
  inputDark: {
    borderColor: '#555',
    color: '#eee',
    backgroundColor: '#2a2a2a',
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Unit picker
  unitRow: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  unitBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
  },
  unitBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Scale readout
  scaleReadout: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
  },
  scaleError: {
    marginTop: 4,
    fontSize: 12,
    color: '#c33',
  },

  // Scale calculator
  calcContainer: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  calcHeader: {
    padding: 12,
  },
  calcHeaderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  calcHeaderSub: {
    fontSize: 11,
    opacity: 0.6,
    marginTop: 2,
  },
  calcBody: {
    padding: 12,
    borderTopWidth: 1,
  },
  calcResult: {
    marginTop: 12,
    padding: 10,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  calcResultText: {
    fontSize: 15,
    fontWeight: '700',
  },
  useScaleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 5,
  },

  // Entries
  entriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  addEntryBtn: {
    fontSize: 14,
    fontWeight: '600',
  },
  addEntryBtnLarge: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    borderStyle: 'dashed',
  },
  addEntryBtnLargeText: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.5,
  },

  // Entry row
  entryRow: {
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 6,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  entryIndex: {
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.5,
  },
  removeBtn: {
    fontSize: 16,
    color: '#c33',
    fontWeight: '700',
    paddingHorizontal: 6,
  },
  resultBox: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 4,
  },
  resultLabel: {
    fontSize: 13,
    opacity: 0.6,
    marginRight: 8,
  },
  resultValue: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Export / reset
  exportBtn: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  statusText: {
    marginTop: 8,
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
  },
  resetBtn: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.6,
  },
})