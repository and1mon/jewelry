<template>
  <div class="space-y-4">
    <!-- Recent Albums -->
    <div v-if="recentAlbums.length > 0 && !hasSearched" class="space-y-2">
      <h3 class="text-sm font-semibold text-gray-600 dark:text-gray-400">Recent Albums</h3>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="album in recentAlbums"
          :key="album.id"
          class="group relative flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          @click="selectRecentAlbum(album)"
        >
          <img 
            v-if="album.thumbnail"
            :src="album.thumbnail"
            :alt="album.title"
            class="w-8 h-8 rounded object-cover"
          />
          <div class="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded flex items-center justify-center" v-else>
            <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <div class="min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate max-w-32">{{ album.title }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-32">{{ album.artist }}</p>
          </div>
          <!-- Remove button -->
          <button
            @click.stop="removeRecentAlbum(album.id)"
            class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            title="Remove from recent"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Search Input -->
    <div class="flex gap-2">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search for album or artist..."
        class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        @keyup.enter="handleSearch"
      />
      <button
        @click="handleSearch"
        :disabled="isLoading || !searchQuery.trim()"
        class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <span v-if="isLoading">Searching...</span>
        <span v-else>Search</span>
      </button>
    </div>
    
    <!-- Filter Options -->
    <div v-if="searchResults.length > 0 || hasSearched" class="flex flex-wrap items-center gap-4">
      <span class="text-xs text-gray-500 dark:text-gray-400">Filter:</span>
      <label class="flex items-center gap-2 text-sm cursor-pointer" :class="filterHasBoth ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'">
        <input
          type="checkbox"
          v-model="filterHasFrontCover"
          :disabled="filterHasBoth"
          class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
        />
        <span>Has front</span>
      </label>
      <label class="flex items-center gap-2 text-sm cursor-pointer" :class="filterHasBoth ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'">
        <input
          type="checkbox"
          v-model="filterHasBackCover"
          :disabled="filterHasBoth"
          class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
        />
        <span>Has back</span>
      </label>
      <label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
        <input
          type="checkbox"
          v-model="filterHasBoth"
          class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
        <span>Has both</span>
      </label>
    </div>
    
    <!-- Error Message -->
    <div v-if="error" class="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
      {{ error }}
    </div>
    
    <!-- Search Results -->
    <div v-if="filteredResults.length > 0" class="space-y-2">
      <h3 class="text-sm font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-2">
        Showing {{ filteredResults.length }} of {{ searchResults.length }} results
        <span v-if="isCheckingCoverArt" class="text-xs font-normal text-gray-400 dark:text-gray-500">
          (checking cover art...)
        </span>
      </h3>
      
      <div class="max-h-96 overflow-y-auto space-y-2">
        <div
          v-for="release in filteredResults"
          :key="release.id"
          @click="selectRelease(release)"
          class="flex items-center gap-4 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors"
        >
          <!-- Thumbnails -->
          <div class="flex gap-1 flex-shrink-0">
            <!-- Front cover thumbnail -->
            <div class="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-gray-400 overflow-hidden">
              <img 
                v-if="getCoverArtStatus(release.id).hasFront && !thumbnailErrors[release.id + '-front']"
                :src="getThumbnailUrl(release.id, 'front')"
                :alt="release.title + ' front'"
                class="w-full h-full object-cover"
                loading="lazy"
                @error="thumbnailErrors[release.id + '-front'] = true"
              />
              <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <!-- Back cover thumbnail -->
            <div class="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-gray-400 overflow-hidden">
              <img 
                v-if="getCoverArtStatus(release.id).hasBack && !thumbnailErrors[release.id + '-back']"
                :src="getThumbnailUrl(release.id, 'back')"
                :alt="release.title + ' back'"
                class="w-full h-full object-cover"
                loading="lazy"
                @error="thumbnailErrors[release.id + '-back'] = true"
              />
              <span v-else class="text-xs text-gray-400">Back</span>
            </div>
          </div>
          
          <!-- Release Info -->
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-900 dark:text-white truncate">
              {{ release.title }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 truncate">
              {{ getArtistName(release) }}
              <span v-if="release.date" class="text-gray-400"> ({{ release.date?.substring(0, 4) }})</span>
            </p>
            <p v-if="release['label-info']?.length" class="text-xs text-gray-500 dark:text-gray-500 truncate">
              {{ release['label-info'][0]?.label?.name }}
              <span v-if="release['label-info'][0]?.['catalog-number']">
                - {{ release['label-info'][0]['catalog-number'] }}
              </span>
            </p>
          </div>
          
          <!-- Cover Art Availability Indicators -->
          <div class="flex items-center gap-1 flex-shrink-0">
            <!-- Loading spinner while checking -->
            <template v-if="!getCoverArtStatus(release.id).checked">
              <div class="w-5 h-5 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin dark:border-gray-600 dark:border-t-gray-400"></div>
            </template>
            <template v-else>
              <!-- Front cover indicator -->
              <span 
                :class="[
                  'px-1.5 py-0.5 text-xs font-medium rounded',
                  getCoverArtStatus(release.id).hasFront 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                ]"
                :title="getCoverArtStatus(release.id).hasFront ? 'Front cover available' : 'No front cover'"
              >
                F
              </span>
              <!-- Back cover indicator -->
              <span 
                :class="[
                  'px-1.5 py-0.5 text-xs font-medium rounded',
                  getCoverArtStatus(release.id).hasBack 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                ]"
                :title="getCoverArtStatus(release.id).hasBack ? 'Back cover available' : 'No back cover'"
              >
                B
              </span>
            </template>
          </div>
          
          <!-- Select Button -->
          <button class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors">
            Select
          </button>
        </div>
      </div>
      
      <!-- Load More Results Button -->
      <div class="pt-2">
        <button
          @click="handleLoadMore"
          :disabled="isLoading || isCheckingCoverArt"
          class="w-full py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span v-if="isLoading || isCheckingCoverArt">Loading...</span>
          <span v-else>Load more results</span>
        </button>
      </div>
    </div>
    
    <!-- No Results -->
    <div v-else-if="hasSearched && !isLoading" class="text-center py-8 text-gray-500 dark:text-gray-400">
      <p v-if="searchResults.length > 0 && filteredResults.length === 0">
        No releases match your filter criteria. Try disabling some filters.
      </p>
      <p v-else>No releases found. Try a different search term.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useMusicBrainz } from '../composables/useMusicBrainz.js'
import { useRecentAlbums } from '../composables/useRecentAlbums.js'

const emit = defineEmits(['select'])

const { 
  isLoading, 
  error, 
  searchResults, 
  searchReleases, 
  loadMoreResults,
  getArtistName,
  checkCoverArtBatch,
  getCoverArtStatus,
  isCheckingCoverArt,
} = useMusicBrainz()

const { recentAlbums, removeRecentAlbum } = useRecentAlbums()

const searchQuery = ref('')
const hasSearched = ref(false)
const thumbnailErrors = reactive({}) // Track failed thumbnail loads
const filterHasFrontCover = ref(false)
const filterHasBackCover = ref(false)
const filterHasBoth = ref(false)

// Filtered results based on cover availability
const filteredResults = computed(() => {
  return searchResults.value.filter(release => {
    const status = getCoverArtStatus(release.id)
    
    // If still checking, show the item (don't filter unchecked items)
    if (!status.checked) {
      return true
    }
    
    // "Has both" takes precedence
    if (filterHasBoth.value) {
      return status.hasFront && status.hasBack
    }
    
    // Check individual filters
    if (filterHasFrontCover.value && !status.hasFront) {
      return false
    }
    if (filterHasBackCover.value && !status.hasBack) {
      return false
    }
    
    return true
  })
})

/**
 * Get thumbnail URL for a release
 * Uses CAA's 250px thumbnail endpoint (HTTPS to avoid mixed content)
 * @param {string} mbid - MusicBrainz release ID
 * @param {string} type - 'front' or 'back'
 */
const getThumbnailUrl = (mbid, type = 'front') => {
  return `https://coverartarchive.org/release/${mbid}/${type}-250`
}

const handleSearch = async () => {
  if (!searchQuery.value.trim()) return
  hasSearched.value = true
  // Clear previous thumbnail errors
  Object.keys(thumbnailErrors).forEach(key => delete thumbnailErrors[key])
  await searchReleases(searchQuery.value)
  // Check cover art for all results (only 5)
  checkCoverArtBatch(5)
}

const handleLoadMore = async () => {
  const prevCount = searchResults.value.length
  await loadMoreResults(5)
  // Check cover art for newly loaded results
  const newCount = searchResults.value.length - prevCount
  if (newCount > 0) {
    checkCoverArtBatch(newCount)
  }
}

const selectRelease = (release) => {
  emit('select', release)
}

const selectRecentAlbum = (album) => {
  // Emit a minimal release object that can be used by the parent
  emit('select', {
    id: album.id,
    title: album.title,
    'artist-credit': [{ name: album.artist }],
    date: album.date
  })
}
</script>
