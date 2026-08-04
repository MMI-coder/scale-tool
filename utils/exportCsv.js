/**
 * utils/exportCsv.js  -  NATIVE (iOS / Android)
 *
 * Writes the CSV to a cache file and opens the system share sheet.
 * The browser version lives in exportCsv.web.js; Metro picks the right
 * one automatically, so neither platform ever sees the other's code.
 */

import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'

import { generateCSV, csvFileName } from './scaleUtils'

export async function exportCSV(project) {
  const csv = generateCSV(project)
  const fileUri = FileSystem.cacheDirectory + csvFileName(project)

  await FileSystem.writeAsStringAsync(fileUri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  })

  const canShare = await Sharing.isAvailableAsync()
  if (!canShare) {
    throw new Error('Sharing is not available on this device.')
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/csv',
    dialogTitle: `Export: ${project.name || 'Scale Project'}`,
    UTI: 'public.comma-separated-values-text',
  })
}