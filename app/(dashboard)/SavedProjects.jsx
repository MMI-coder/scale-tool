import { useState, useCallback } from 'react'
import {
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect, useRouter } from 'expo-router'
import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'

import Spacer from "../../Components/Spacer"
import ThemedText from "../../Components/ThemedText"
import ThemedView from "../../Components/ThemedView"

import {
  loadProjects,
  persistProjects,
  setEditingId,
  generateCSV,
  fmt,
  multiplierToRatio,
} from '../../utils/scaleUtils'

// ---------------------------------------------------------------------------
// SavedProjects Screen
// ---------------------------------------------------------------------------

const SavedProjects = () => {
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const router = useRouter()

  const [projects, setProjects] = useState([])

  // Reload project list every time this tab gains focus
  useFocusEffect(
    useCallback(() => {
      let cancelled = false

      const load = async () => {
        const data = await loadProjects()
        if (!cancelled) setProjects(data)
      }

      load()
      return () => { cancelled = true }
    }, [])
  )

  // ---- Edit: set flag and navigate to NewProject tab ----

  const handleEdit = async (proj) => {
    await setEditingId(proj.id)
    router.navigate('/(dashboard)/NewProject')
  }

  // ---- Export CSV ----

  const handleExport = async (proj) => {
    if (!proj.multiplier) {
      Alert.alert('No scale', 'This project has no valid scale set.')
      return
    }

    try {
      const csv = generateCSV(proj)
      const fileName = `${proj.name.replace(/[^a-zA-Z0-9]/g, '_')}_scale_project.csv`
      const fileUri = FileSystem.cacheDirectory + fileName

      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      })

      const canShare = await Sharing.isAvailableAsync()
      if (!canShare) {
        Alert.alert('Sharing not available', 'Sharing is not available on this device.')
        return
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: `Export: ${proj.name}`,
        UTI: 'public.comma-separated-values-text',
      })
    } catch (e) {
      console.warn('Export failed', e)
      Alert.alert('Export failed', 'Could not export CSV. ' + (e.message || ''))
    }
  }

  // ---- Delete ----

  const handleDelete = (proj) => {
    Alert.alert('Delete Project', `Delete "${proj.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = projects.filter((p) => p.id !== proj.id)
          setProjects(updated)
          await persistProjects(updated)
        },
      },
    ])
  }

  // ---- Render ----

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: 40 }}
      >
        <ThemedText title={true} style={styles.heading}>
          Saved Projects
        </ThemedText>
        <Spacer />

        {projects.length === 0 && (
          <ThemedText style={styles.emptyText}>
            No saved projects yet.{'\n'}Create one in the New Project tab.
          </ThemedText>
        )}

        {projects.map((proj) => (
          <View
            key={proj.id}
            style={[styles.card, {
              borderColor: isDark ? '#444' : '#ddd',
              backgroundColor: isDark ? '#1a1a1a' : '#fafafa',
            }]}
          >
            {/* Card body – tap to edit */}
            <TouchableOpacity style={styles.cardBody} onPress={() => handleEdit(proj)}>
              <ThemedText style={styles.cardName}>
                {proj.name || 'Untitled'}
              </ThemedText>
              <ThemedText style={styles.cardMeta}>
                Scale: {proj.scaleInput || '—'}
                {'  ·  '}
                {proj.entries.length} entr{proj.entries.length === 1 ? 'y' : 'ies'}
              </ThemedText>
            </TouchableOpacity>

            {/* Action buttons */}
            <View style={[styles.cardActions, { borderTopColor: isDark ? '#444' : '#eee' }]}>
              <TouchableOpacity
                style={[styles.actionBtn, { borderRightColor: isDark ? '#444' : '#eee', borderRightWidth: 1 }]}
                onPress={() => handleEdit(proj)}
              >
                <ThemedText style={[styles.actionBtnText, { color: isDark ? '#7dacf7' : '#25e' }]}>
                  Edit
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { borderRightColor: isDark ? '#444' : '#eee', borderRightWidth: 1 }]}
                onPress={() => handleExport(proj)}
              >
                <ThemedText style={[styles.actionBtnText, { color: isDark ? '#6ecf6e' : '#2a7' }]}>
                  Export CSV
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleDelete(proj)}
              >
                <ThemedText style={[styles.actionBtnText, { color: '#c33' }]}>
                  Delete
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        ))}

      </ScrollView>
    </ThemedView>
  )
}

export default SavedProjects

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

  // Empty state
  emptyText: {
    textAlign: 'center',
    opacity: 0.5,
    marginTop: 40,
    lineHeight: 22,
  },

  // Card
  card: {
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardBody: {
    padding: 14,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardMeta: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 3,
  },

  // Action buttons
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
})