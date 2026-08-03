import { useState, useMemo, useCallback } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Platform,
  useColorScheme,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect, useRouter } from 'expo-router'

import Spacer from "../../Components/Spacer"
import ThemedText from "../../Components/ThemedText"
import ThemedView from "../../Components/ThemedView"

import {
  UNITS,
  DEFAULT_UNIT,
  MAX_ENTRIES,
  toMM,
  fromMM,
  fmt,
  parseScale,
  multiplierToRatio,
  uid,
  blankEntry,
  blankProject,
  loadProjects,
  persistProjects,
  getEditingId,
  clearEditingId,
} from '../../utils/scaleUtils'

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
// NewProject Screen
// ---------------------------------------------------------------------------

const NewProject = () => {
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const router = useRouter()

  const [project, setProject] = useState(blankProject())
  const [editingId, setEditingIdState] = useState(null)

  // Check for an editing flag when this tab gains focus
  useFocusEffect(
    useCallback(() => {
      let cancelled = false

      const checkEditing = async () => {
        const id = await getEditingId()
        if (id && !cancelled) {
          const projects = await loadProjects()
          const found = projects.find((p) => p.id === id)
          if (found) {
            setProject({ ...found })
            setEditingIdState(id)
          }
          await clearEditingId()
        }
      }

      checkEditing()
      return () => { cancelled = true }
    }, [])
  )

  // ---- Scale input ----

  const handleScaleInput = (text) => {
    const multiplier = parseScale(text)
    setProject((p) => ({ ...p, scaleInput: text, multiplier }))
  }

  const handleUseCalculatedScale = (multiplier) => {
    const ratioStr = multiplierToRatio(multiplier)
    setProject((p) => ({ ...p, scaleInput: ratioStr, multiplier }))
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
    if (project.entries.length >= MAX_ENTRIES) {
      Alert.alert('Limit reached', `Maximum ${MAX_ENTRIES} entries per project.`)
      return
    }
    setProject((p) => ({ ...p, entries: [...p.entries, blankEntry()] }))
  }

  const removeEntry = (idx) => {
    setProject((p) => ({
      ...p,
      entries: p.entries.filter((_, i) => i !== idx),
    }))
  }

  // ---- Save ----

  const saveProject = async () => {
    if (!project.name.trim()) {
      Alert.alert('Name required', 'Please enter a project name before saving.')
      return
    }
    if (!project.multiplier) {
      Alert.alert('Scale required', 'Please enter a valid scale before saving.')
      return
    }

    const saved = await loadProjects()
    let updated

    if (editingId) {
      updated = saved.map((p) => (p.id === editingId ? { ...project, id: editingId } : p))
    } else {
      updated = [...saved, { ...project }]
    }

    await persistProjects(updated)
    Alert.alert('Saved', `"${project.name}" has been saved.`)

    setProject(blankProject())
    setEditingIdState(null)
  }

  // ---- Reset ----

  const startNewProject = () => {
    const hasContent = project.name.trim() || project.entries.some((e) => e.label || e.value)
    if (hasContent) {
      Alert.alert('Unsaved changes', 'Start a new project? Unsaved changes will be lost.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'New Project',
          onPress: () => {
            setProject(blankProject())
            setEditingIdState(null)
          },
        },
      ])
    } else {
      setProject(blankProject())
      setEditingIdState(null)
    }
  }

  // ---- Render ----

  const inputStyle = [styles.input, isDark && styles.inputDark]

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedText title={true} style={styles.heading}>
          {editingId ? 'Edit Project' : 'Start a New Project'}
        </ThemedText>
        <Spacer />

        {/* New Project button when editing */}
        {editingId && (
          <TouchableOpacity
            style={[styles.newProjectBtn, { borderColor: isDark ? '#6ecf6e' : '#2a7' }]}
            onPress={startNewProject}
          >
            <ThemedText style={[styles.newProjectBtnText, { color: isDark ? '#6ecf6e' : '#2a7' }]}>
              + Start New Project
            </ThemedText>
          </TouchableOpacity>
        )}

        {/* Project name */}
        <ThemedText style={styles.fieldLabel}>Project Name</ThemedText>
        <TextInput
          style={inputStyle}
          value={project.name}
          onChangeText={(t) => setProject((p) => ({ ...p, name: t }))}
          placeholder="e.g. What is your name?"
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

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: isDark ? '#ddd' : '#333' }]}
          onPress={saveProject}
        >
          <ThemedText style={{ color: isDark ? '#111' : '#fff', fontSize: 16, fontWeight: '600' }}>
            {editingId ? 'Save Changes' : 'Save Project'}
          </ThemedText>
        </TouchableOpacity>

      </ScrollView>
    </ThemedView>
  )
}

export default NewProject

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
  heading: {
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
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

  // Save / New Project buttons
  saveBtn: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  newProjectBtn: {
    marginBottom: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
  },
  newProjectBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
})