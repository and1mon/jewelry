// MusicBrainz API composable
// API docs: https://musicbrainz.org/doc/MusicBrainz_API

import { ref } from 'vue'

const API_BASE = 'https://musicbrainz.org/ws/2'
const USER_AGENT = 'CDInlayGenerator/1.0'

// Rate limiting: max 1 request per second for MusicBrainz
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1100 // 1.1 seconds to be safe

const waitForRateLimit = async () => {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest
    await new Promise(resolve => setTimeout(resolve, waitTime))
  }
  
  lastRequestTime = Date.now()
}

const fetchFromMusicBrainz = async (endpoint, params = {}) => {
  await waitForRateLimit()
  
  const url = new URL(`${API_BASE}${endpoint}`)
  url.searchParams.set('fmt', 'json')
  
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  
  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json',
    },
  })
  
  if (!response.ok) {
    throw new Error(`MusicBrainz API error: ${response.status} ${response.statusText}`)
  }
  
  return response.json()
}

export function useMusicBrainz() {
  const isLoading = ref(false)
  const error = ref(null)
  const searchResults = ref([])
  const selectedRelease = ref(null)
  const coverArtAvailability = ref({}) // Map of mbid -> { hasFront, hasBack, checked }
  const isCheckingCoverArt = ref(false)
  
  /**
   * Search for releases by query (album name, artist, etc.)
   * @param {string} query - Search query
   * @param {number} limit - Max results to return (default 5)
   */
  const searchReleases = async (query, limit = 5) => {
    if (!query.trim()) {
      searchResults.value = []
      return
    }
    
    lastQuery = query
    isLoading.value = true
    error.value = null
    
    try {
      const data = await fetchFromMusicBrainz('/release', {
        query: query,
        limit: limit.toString(),
      })
      
      searchResults.value = data.releases || []
    } catch (err) {
      error.value = err.message
      searchResults.value = []
    } finally {
      isLoading.value = false
    }
  }
  
  // Store last query for "load more" functionality
  let lastQuery = ''
  
  /**
   * Search and append more results
   * @param {number} count - Number of additional results to load
   */
  const loadMoreResults = async (count = 5) => {
    if (!lastQuery || isLoading.value) return
    
    isLoading.value = true
    
    try {
      const offset = searchResults.value.length
      const data = await fetchFromMusicBrainz('/release', {
        query: lastQuery,
        limit: count.toString(),
        offset: offset.toString(),
      })
      
      const newReleases = data.releases || []
      searchResults.value = [...searchResults.value, ...newReleases]
      
      // Return whether there might be more results
      return newReleases.length === count
    } catch (err) {
      error.value = err.message
      return false
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Get detailed information about a specific release
   * @param {string} mbid - MusicBrainz ID of the release
   */
  const getReleaseDetails = async (mbid) => {
    isLoading.value = true
    error.value = null
    
    try {
      const data = await fetchFromMusicBrainz(`/release/${mbid}`, {
        inc: 'artist-credits+labels+recordings+release-groups',
      })
      
      selectedRelease.value = data
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Get the primary artist name from a release
   */
  const getArtistName = (release) => {
    if (!release) return ''
    
    if (release['artist-credit'] && release['artist-credit'].length > 0) {
      return release['artist-credit']
        .map(ac => ac.name || ac.artist?.name)
        .filter(Boolean)
        .join(', ')
    }
    
    return ''
  }
  
  /**
   * Get track listing from a release
   */
  const getTrackList = (release) => {
    if (!release || !release.media) return []
    
    const tracks = []
    for (const medium of release.media) {
      if (medium.tracks) {
        for (const track of medium.tracks) {
          tracks.push({
            number: track.number,
            title: track.title,
            length: track.length, // in milliseconds
          })
        }
      }
    }
    
    return tracks
  }
  
  /**
   * Format track length from milliseconds to MM:SS
   */
  const formatTrackLength = (ms) => {
    if (!ms) return ''
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
  
  const clearSearch = () => {
    searchResults.value = []
    error.value = null
    coverArtAvailability.value = {}
  }
  
  const clearSelection = () => {
    selectedRelease.value = null
  }
  
  /**
   * Check cover art availability for a batch of search results
   * Uses MusicBrainz release lookup which includes cover-art-archive info
   * This avoids 404s from CAA for releases without artwork
   * @param {number} count - Number of unchecked releases to check
   */
  const checkCoverArtBatch = async (count = 5) => {
    if (searchResults.value.length === 0) return
    
    // Find unchecked releases
    const unchecked = searchResults.value.filter(
      r => !coverArtAvailability.value[r.id]?.checked
    )
    
    if (unchecked.length === 0) return
    
    isCheckingCoverArt.value = true
    
    // Process only the requested count
    const toCheck = unchecked.slice(0, count)
    
    for (const release of toCheck) {
      try {
        // Fetch release details which includes cover-art-archive info
        const data = await fetchFromMusicBrainz(`/release/${release.id}`)
        const caa = data['cover-art-archive'] || {}
        
        coverArtAvailability.value = {
          ...coverArtAvailability.value,
          [release.id]: {
            hasFront: caa.front || false,
            hasBack: caa.back || false,
            checked: true
          }
        }
      } catch {
        // On error, mark as checked but no artwork
        coverArtAvailability.value = {
          ...coverArtAvailability.value,
          [release.id]: { hasFront: false, hasBack: false, checked: true }
        }
      }
    }
    
    isCheckingCoverArt.value = false
  }
  
  /**
   * Get count of unchecked releases
   */
  const getUncheckedCount = () => {
    return searchResults.value.filter(
      r => !coverArtAvailability.value[r.id]?.checked
    ).length
  }
  
  /**
   * Get cover art availability for a specific release
   */
  const getCoverArtStatus = (mbid) => {
    return coverArtAvailability.value[mbid] || { hasFront: false, hasBack: false, checked: false }
  }
  
  return {
    isLoading,
    error,
    searchResults,
    selectedRelease,
    coverArtAvailability,
    isCheckingCoverArt,
    searchReleases,
    getReleaseDetails,
    getArtistName,
    getTrackList,
    formatTrackLength,
    clearSearch,
    clearSelection,
    loadMoreResults,
    checkCoverArtBatch,
    getUncheckedCount,
    getCoverArtStatus,
  }
}
