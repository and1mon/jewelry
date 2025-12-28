<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 shadow-sm">
      <div class="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold">
            <span class="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
              Jewelry
            </span>
          </h1>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Create printable CD jewel case inserts
          </p>
        </div>
        <!-- Dark Mode Toggle -->
        <button
          @click="toggleDarkMode"
          class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          :title="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
        >
          <!-- Sun icon (show in dark mode) -->
          <svg v-if="isDarkMode" class="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
          </svg>
          <!-- Moon icon (show in light mode) -->
          <svg v-else class="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        </button>
      </div>
    </header>
    
    <!-- Main Content -->
    <main class="max-w-6xl mx-auto px-4 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Left Column: Input -->
        <div class="space-y-6">
          <!-- MusicBrainz Search -->
          <div class="space-y-4">
            <AlbumSearch @select="handleReleaseSelect" />
            
            <!-- Selected Release Info -->
            <div v-if="selectedRelease" class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div class="flex items-start gap-3">
                <img 
                  v-if="frontCover" 
                  :src="frontCover" 
                  alt="Cover" 
                  class="w-16 h-16 object-cover rounded shadow"
                />
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-gray-900 dark:text-white truncate">
                    {{ selectedRelease.title }}
                  </p>
                  <p class="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {{ artistName }}
                  </p>
                  <p v-if="selectedRelease.date" class="text-xs text-gray-500 dark:text-gray-500">
                    {{ selectedRelease.date }}
                  </p>
                </div>
                <button
                  @click="clearSelection"
                  class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Clear selection"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <!-- Loading indicator -->
              <div v-if="isLoadingCoverArt" class="mt-3 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading cover art...
              </div>
            </div>
          </div>
          
          <!-- Cover Art Section -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">Cover Art</h3>
              <!-- Swap Button -->
              <button
                v-if="frontCover || backCover"
                @click="swapCovers"
                class="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Swap front and back covers"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Swap
              </button>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <!-- Front Cover -->
              <div class="space-y-2">
                <label class="block text-xs text-gray-600 dark:text-gray-400">Front Cover</label>
                <div
                  @click="triggerFrontUpload"
                  @dragover.prevent="dragOver = 'front'"
                  @dragleave="dragOver = null"
                  @drop.prevent="handleDrop($event, 'front')"
                  :class="[
                    'relative aspect-square border-2 border-dashed rounded-lg cursor-pointer transition-colors overflow-hidden',
                    dragOver === 'front' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                  ]"
                >
                  <img 
                    v-if="frontCover" 
                    :src="frontCover" 
                    alt="Front cover" 
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span class="text-xs mt-1">Add front</span>
                  </div>
                  <!-- Clear button -->
                  <button
                    v-if="frontCover"
                    @click.stop="frontCover = null"
                    class="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                    title="Remove front cover"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <input
                  ref="frontInput"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleFrontUpload"
                />
              </div>
              
              <!-- Back Cover -->
              <div class="space-y-2">
                <label class="block text-xs text-gray-600 dark:text-gray-400">Back Cover</label>
                <div
                  @click="triggerBackUpload"
                  @dragover.prevent="dragOver = 'back'"
                  @dragleave="dragOver = null"
                  @drop.prevent="handleDrop($event, 'back')"
                  :class="[
                    'relative aspect-square border-2 border-dashed rounded-lg cursor-pointer transition-colors overflow-hidden',
                    dragOver === 'back' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                  ]"
                >
                  <img 
                    v-if="backCover" 
                    :src="backCover" 
                    alt="Back cover" 
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span class="text-xs mt-1">Add back</span>
                  </div>
                  <!-- Clear button -->
                  <button
                    v-if="backCover"
                    @click.stop="backCover = null; backImageIncludesSpines = true"
                    class="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                    title="Remove back cover"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <input
                  ref="backInput"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleBackUpload"
                />
                
                <!-- Spine included checkbox -->
                <div v-if="backCover" class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="spineIncluded"
                    v-model="backImageIncludesSpines"
                    class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label for="spineIncluded" class="text-xs text-gray-600 dark:text-gray-400">
                    Includes spine areas
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Album Info (always visible for spine text) -->
          <div class="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">Album Information</h3>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">Artist Name</label>
                <input
                  v-model="manualArtistName"
                  type="text"
                  placeholder="Artist name"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">Album Name</label>
                <input
                  v-model="manualAlbumName"
                  type="text"
                  placeholder="Album name"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
          </div>
          
          <!-- Spine Editor (when back cover doesn't include spines OR no back cover) -->
          <div v-if="!backCover || !backImageIncludesSpines">
            <SpineEditor v-model="spineConfig" />
          </div>
        </div>
        
        <!-- Right Column: Preview -->
        <div class="lg:sticky lg:top-8 lg:self-start">
          <Preview
            :front-cover="frontCover"
            :back-cover="backCover"
            :back-image-includes-spines="backImageIncludesSpines"
            :spine-config="effectiveSpineConfig"
            :artist-name="artistName"
            :album-name="albumName"
            :warnings="warnings"
            :left-edge-color="leftEdgeColor"
            :right-edge-color="rightEdgeColor"
          />
        </div>
      </div>
    </main>
    
    <!-- Footer -->
    <footer class="mt-16 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
      <p>
        Data provided by 
        <a href="https://musicbrainz.org" target="_blank" class="text-blue-600 hover:underline dark:text-blue-400">MusicBrainz</a>
        and
        <a href="https://coverartarchive.org" target="_blank" class="text-blue-600 hover:underline dark:text-blue-400">Cover Art Archive</a>
      </p>
      <p class="mt-2 text-xs text-gray-400 dark:text-gray-500">
        Anonymous analytics by <a href="https://www.goatcounter.com" target="_blank" class="hover:underline">GoatCounter</a> (no cookies, no personal data)
      </p>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import AlbumSearch from './components/AlbumSearch.vue'
import SpineEditor from './components/SpineEditor.vue'
import Preview from './components/Preview.vue'
import { useMusicBrainz } from './composables/useMusicBrainz.js'
import { useCoverArt } from './composables/useCoverArt.js'
import { useRecentAlbums } from './composables/useRecentAlbums.js'

// Dark mode
const isDarkMode = ref(false)

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
  document.documentElement.classList.toggle('dark', isDarkMode.value)
  localStorage.setItem('darkMode', isDarkMode.value ? 'true' : 'false')
}

// Initialize dark mode from localStorage or system preference
onMounted(() => {
  const stored = localStorage.getItem('darkMode')
  if (stored !== null) {
    isDarkMode.value = stored === 'true'
  } else {
    isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  document.documentElement.classList.toggle('dark', isDarkMode.value)
})

// Recent albums
const { addRecentAlbum } = useRecentAlbums()

// MusicBrainz
const { 
  selectedRelease, 
  getReleaseDetails, 
  getArtistName: getMbArtistName,
  clearSelection: clearMbSelection 
} = useMusicBrainz()

// Cover Art
const {
  isLoading: isLoadingCoverArt,
  frontCover: fetchedFrontCover,
  backCover: fetchedBackCover,
  hasFrontCover,
  hasBackCover,
  backCoverFormat,
  detectedSpineColor,
  detectedSpineTextColor,
  detectedLeftEdgeColor,
  detectedRightEdgeColor,
  fetchCoverArt,
  clearCoverArt,
} = useCoverArt()

// Local state
const frontCover = ref(null)
const backCover = ref(null)
const backImageIncludesSpines = ref(true)
const manualArtistName = ref('')
const manualAlbumName = ref('')
const leftEdgeColor = ref('#000000')
const rightEdgeColor = ref('#000000')

// File inputs
const frontInput = ref(null)
const backInput = ref(null)
const dragOver = ref(null)

const spineConfig = ref({
  backgroundColor: '#000000',
  textColor: '#ffffff',
  artistName: '',
  artistColor: null,
  artistBold: false,
  artistItalic: false,
  albumName: '',
  albumColor: null,
  albumBold: false,
  albumItalic: false,
  separator: ' - ',
  alignment: 'center',
  fontSize: 7,
  leftRotation: 'bottom-to-top',
  rightRotation: 'top-to-bottom',
})

// Computed
const artistName = computed(() => {
  if (manualArtistName.value) {
    return manualArtistName.value
  }
  if (selectedRelease.value) {
    return getMbArtistName(selectedRelease.value)
  }
  return ''
})

const albumName = computed(() => {
  if (manualAlbumName.value) {
    return manualAlbumName.value
  }
  if (selectedRelease.value) {
    return selectedRelease.value.title || ''
  }
  return ''
})

const effectiveSpineConfig = computed(() => {
  return {
    ...spineConfig.value,
    artistName: spineConfig.value.artistName || artistName.value,
    albumName: spineConfig.value.albumName || albumName.value,
  }
})

const warnings = computed(() => {
  const w = []
  
  if (selectedRelease.value && !isLoadingCoverArt.value) {
    if (!hasFrontCover.value && !frontCover.value) {
      w.push('No front cover available for this release')
    }
    if (!hasBackCover.value && !backCover.value) {
      w.push('No back cover available - using template with spine configuration')
    }
  }
  
  return w
})

// Watch for cover art fetch results
watch(fetchedFrontCover, (val) => {
  if (val) {
    frontCover.value = val
  }
})

watch(fetchedBackCover, (val) => {
  if (val) {
    backCover.value = val
  }
})

// Watch for back cover format detection (fires after image is analyzed)
watch(backCoverFormat, (format) => {
  if (backCover.value && format) {
    backImageIncludesSpines.value = format === 'with-spines'
  }
})

// Watch for detected edge colors (these update after back cover is analyzed)
watch([detectedSpineColor, detectedLeftEdgeColor, detectedRightEdgeColor], () => {
  if (backCover.value && backCoverFormat.value === 'without-spines') {
    spineConfig.value.backgroundColor = detectedSpineColor.value
    spineConfig.value.textColor = detectedSpineTextColor.value
    leftEdgeColor.value = detectedLeftEdgeColor.value
    rightEdgeColor.value = detectedRightEdgeColor.value
  }
})

// Handle release selection
const handleReleaseSelect = async (release) => {
  // Clear previous covers (but keep manual overrides if user uploaded)
  clearCoverArt()
  
  // Fetch release details
  await getReleaseDetails(release.id)
  
  // Update album info
  manualArtistName.value = getMbArtistName(release)
  manualAlbumName.value = release.title || ''
  spineConfig.value.artistName = ''
  spineConfig.value.albumName = ''
  
  // Fetch cover art
  await fetchCoverArt(release.id)
  
  // Add to recent albums
  addRecentAlbum({
    id: release.id,
    title: release.title || '',
    artist: getMbArtistName(release),
    date: release.date || null,
    thumbnail: `https://coverartarchive.org/release/${release.id}/front-250`
  })
}

const clearSelection = () => {
  clearMbSelection()
  clearCoverArt()
  frontCover.value = null
  backCover.value = null
  manualArtistName.value = ''
  manualAlbumName.value = ''
  spineConfig.value.artistName = ''
  spineConfig.value.albumName = ''
  leftEdgeColor.value = '#000000'
  rightEdgeColor.value = '#000000'
  backImageIncludesSpines.value = true
}

// Swap front and back covers
const swapCovers = () => {
  const temp = frontCover.value
  frontCover.value = backCover.value
  backCover.value = temp
  
  // If swapping, the new back cover probably doesn't include spines
  if (backCover.value) {
    backImageIncludesSpines.value = false
    detectBackCoverColors(backCover.value)
  }
}

// File upload handlers
const triggerFrontUpload = () => {
  frontInput.value?.click()
}

const triggerBackUpload = () => {
  backInput.value?.click()
}

const readFileAsDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const handleFrontUpload = async (event) => {
  const file = event.target.files?.[0]
  if (file) {
    const dataUrl = await readFileAsDataUrl(file)
    frontCover.value = dataUrl
  }
  // Reset input so same file can be selected again
  event.target.value = ''
}

const handleBackUpload = async (event) => {
  const file = event.target.files?.[0]
  if (file) {
    const dataUrl = await readFileAsDataUrl(file)
    backCover.value = dataUrl
    // For manual uploads, default to not including spines
    backImageIncludesSpines.value = false
    // Detect edge colors for the uploaded image
    await detectBackCoverColors(dataUrl)
  }
  event.target.value = ''
}

const handleDrop = async (event, type) => {
  dragOver.value = null
  const file = event.dataTransfer.files?.[0]
  if (file && file.type.startsWith('image/')) {
    const dataUrl = await readFileAsDataUrl(file)
    if (type === 'front') {
      frontCover.value = dataUrl
    } else {
      backCover.value = dataUrl
      backImageIncludesSpines.value = false
      // Detect edge colors for the dropped image
      await detectBackCoverColors(dataUrl)
    }
  }
}

/**
 * Detect edge colors from a back cover image and update spine config
 */
const detectBackCoverColors = async (dataUrl) => {
  try {
    const leftColor = await extractEdgeColor(dataUrl, 'left')
    const rightColor = await extractEdgeColor(dataUrl, 'right')
    leftEdgeColor.value = leftColor
    rightEdgeColor.value = rightColor
    
    // Average for spine background
    const avgColor = averageHexColors(leftColor, rightColor)
    spineConfig.value.backgroundColor = avgColor
    spineConfig.value.textColor = getContrastingTextColor(avgColor)
  } catch (err) {
    console.error('Error detecting back cover colors:', err)
  }
}

/**
 * Extract edge color from image (simplified version for App.vue)
 */
const extractEdgeColor = (dataUrl, edge = 'left') => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      
      const sampleWidth = Math.max(5, Math.floor(img.width * 0.01))
      const x = edge === 'left' ? 0 : img.width - sampleWidth
      
      const imageData = ctx.getImageData(x, 0, sampleWidth, img.height)
      const pixels = imageData.data
      
      let totalR = 0, totalG = 0, totalB = 0
      const pixelCount = pixels.length / 4
      
      for (let i = 0; i < pixels.length; i += 4) {
        totalR += pixels[i]
        totalG += pixels[i + 1]
        totalB += pixels[i + 2]
      }
      
      const r = Math.round(totalR / pixelCount)
      const g = Math.round(totalG / pixelCount)
      const b = Math.round(totalB / pixelCount)
      
      const hex = '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')
      resolve(hex)
    }
    img.onerror = () => resolve('#000000')
    img.src = dataUrl
  })
}

const averageHexColors = (hex1, hex2) => {
  const c1 = hex1.replace('#', '')
  const c2 = hex2.replace('#', '')
  
  const r = Math.round((parseInt(c1.substr(0, 2), 16) + parseInt(c2.substr(0, 2), 16)) / 2)
  const g = Math.round((parseInt(c1.substr(2, 2), 16) + parseInt(c2.substr(2, 2), 16)) / 2)
  const b = Math.round((parseInt(c1.substr(4, 2), 16) + parseInt(c2.substr(4, 2), 16)) / 2)
  
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')
}

const getContrastingTextColor = (hexColor) => {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#000000' : '#ffffff'
}
</script>
