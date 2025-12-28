import { ref, watch } from 'vue'

const STORAGE_KEY = 'recentAlbums'
const MAX_RECENT = 5

// Shared state across all uses
const recentAlbums = ref([])

// Load from localStorage on init
const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      recentAlbums.value = JSON.parse(stored)
    }
  } catch (e) {
    console.warn('Failed to load recent albums from localStorage:', e)
    recentAlbums.value = []
  }
}

// Save to localStorage
const saveToStorage = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recentAlbums.value))
  } catch (e) {
    console.warn('Failed to save recent albums to localStorage:', e)
  }
}

// Initialize on first load
loadFromStorage()

export function useRecentAlbums() {
  /**
   * Add an album to recent history
   * @param {Object} album - Album data to store
   * @param {string} album.id - MusicBrainz release ID
   * @param {string} album.title - Album title
   * @param {string} album.artist - Artist name
   * @param {string} [album.date] - Release date
   * @param {string} [album.thumbnail] - Thumbnail URL
   */
  const addRecentAlbum = (album) => {
    // Remove if already exists (to move it to front)
    const filtered = recentAlbums.value.filter(a => a.id !== album.id)
    
    // Add to front
    recentAlbums.value = [
      {
        id: album.id,
        title: album.title,
        artist: album.artist,
        date: album.date || null,
        thumbnail: album.thumbnail || null,
        addedAt: Date.now()
      },
      ...filtered
    ].slice(0, MAX_RECENT) // Keep only last 5
    
    saveToStorage()
  }

  /**
   * Remove an album from recent history
   * @param {string} id - MusicBrainz release ID
   */
  const removeRecentAlbum = (id) => {
    recentAlbums.value = recentAlbums.value.filter(a => a.id !== id)
    saveToStorage()
  }

  /**
   * Clear all recent albums
   */
  const clearRecentAlbums = () => {
    recentAlbums.value = []
    saveToStorage()
  }

  return {
    recentAlbums,
    addRecentAlbum,
    removeRecentAlbum,
    clearRecentAlbums
  }
}
