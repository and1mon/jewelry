<template>
  <div class="space-y-4">
    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">
      Preview
      <span class="text-xs font-normal text-gray-500 dark:text-gray-400 ml-2">(click to enlarge)</span>
    </h3>
    
    <!-- Warnings -->
    <div v-if="warnings.length > 0" class="space-y-2">
      <div 
        v-for="(warning, idx) in warnings" 
        :key="idx"
        class="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400"
      >
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>{{ warning }}</span>
      </div>
    </div>
    
    <!-- Preview Container -->
    <div class="flex flex-col items-center gap-6 p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <!-- Front Cover Preview -->
      <div class="text-center">
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Front Cover (120 x 120 mm)</p>
        <div 
          class="relative bg-white dark:bg-gray-700 shadow-md cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
          :style="{ width: frontPreviewSize + 'px', height: frontPreviewSize + 'px' }"
          @click="openFullscreen('front')"
        >
          <img 
            v-if="frontCover" 
            :src="frontCover" 
            alt="Front cover preview"
            class="w-full h-full object-cover"
          />
          <div 
            v-else 
            class="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500"
          >
            <span class="text-sm">No front cover</span>
          </div>
        </div>
      </div>
      
      <!-- Back Inlay Preview -->
      <div class="text-center">
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Back Inlay (150 x 118 mm)</p>
        <div 
          class="relative flex bg-white dark:bg-gray-700 shadow-md overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
          :style="{ width: backPreviewWidth + 'px', height: backPreviewHeight + 'px' }"
          @click="openFullscreen('back')"
        >
          <!-- Left Spine -->
          <div 
            v-if="!backImageIncludesSpines || !backCover"
            class="flex-shrink-0 relative overflow-hidden"
            :style="{ 
              width: spinePreviewWidth + 'px',
              backgroundColor: spineConfig.backgroundColor,
            }"
          >
            <!-- Rotated spine text -->
            <div 
              class="absolute whitespace-nowrap"
              :style="leftSpineTextStyle"
            >
              <span :style="{ color: spineConfig.artistColor || spineConfig.textColor, fontWeight: spineConfig.artistBold ? 'bold' : 'normal', fontStyle: spineConfig.artistItalic ? 'italic' : 'normal' }">{{ spineArtist }}</span><span v-if="spineArtist && spineAlbum" :style="{ color: spineConfig.textColor }">{{ spineConfig.separator ?? ' - ' }}</span><span :style="{ color: spineConfig.albumColor || spineConfig.textColor, fontWeight: spineConfig.albumBold ? 'bold' : 'normal', fontStyle: spineConfig.albumItalic ? 'italic' : 'normal' }">{{ spineAlbum }}</span>
            </div>
          </div>
          
          <!-- Center / Full Back -->
          <div 
            class="flex-1 relative overflow-hidden flex"
            :style="backImageIncludesSpines ? {} : { backgroundColor: centerBackgroundColor }"
          >
            <!-- Left edge color fill for letterboxing -->
            <div 
              v-if="!backImageIncludesSpines && backCover"
              class="absolute left-0 top-0 bottom-0 w-1/2"
              :style="{ backgroundColor: leftEdgeColor }"
            ></div>
            <!-- Right edge color fill for letterboxing -->
            <div 
              v-if="!backImageIncludesSpines && backCover"
              class="absolute right-0 top-0 bottom-0 w-1/2"
              :style="{ backgroundColor: rightEdgeColor }"
            ></div>
            <img 
              v-if="backCover" 
              :src="backCover" 
              alt="Back cover preview"
              :class="[
                'relative z-10 m-auto',
                backImageIncludesSpines ? 'w-full h-full object-cover' : 'max-w-full max-h-full object-contain'
              ]"
            />
            <div 
              v-else 
              class="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-600"
            >
              <span class="text-sm">No back cover</span>
            </div>
          </div>
          
          <!-- Right Spine -->
          <div 
            v-if="!backImageIncludesSpines || !backCover"
            class="flex-shrink-0 relative overflow-hidden"
            :style="{ 
              width: spinePreviewWidth + 'px',
              backgroundColor: spineConfig.backgroundColor,
            }"
          >
            <!-- Rotated spine text -->
            <div 
              class="absolute whitespace-nowrap"
              :style="rightSpineTextStyle"
            >
              <span :style="{ color: spineConfig.artistColor || spineConfig.textColor, fontWeight: spineConfig.artistBold ? 'bold' : 'normal', fontStyle: spineConfig.artistItalic ? 'italic' : 'normal' }">{{ spineArtist }}</span><span v-if="spineArtist && spineAlbum" :style="{ color: spineConfig.textColor }">{{ spineConfig.separator ?? ' - ' }}</span><span :style="{ color: spineConfig.albumColor || spineConfig.textColor, fontWeight: spineConfig.albumBold ? 'bold' : 'normal', fontStyle: spineConfig.albumItalic ? 'italic' : 'normal' }">{{ spineAlbum }}</span>
            </div>
          </div>
          
          <!-- Fold lines overlay (when back includes spines) -->
          <template v-if="backImageIncludesSpines && backCover">
            <div 
              class="absolute top-0 bottom-0 border-l border-dashed border-gray-400 dark:border-gray-500"
              :style="{ left: spinePreviewWidth + 'px' }"
            ></div>
            <div 
              class="absolute top-0 bottom-0 border-l border-dashed border-gray-400 dark:border-gray-500"
              :style="{ right: spinePreviewWidth + 'px' }"
            ></div>
          </template>
        </div>
      </div>
      
      <!-- Spine Preview (horizontal for readability) -->
      <div v-if="!backImageIncludesSpines || !backCover" class="text-center w-full">
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Spine (6 x 118 mm) · {{ rotationLabel }}</p>
        <div 
          class="w-full flex items-center justify-center rounded shadow-md"
          :style="{ 
            height: (spinePreviewWidth * 2.5) + 'px',
            backgroundColor: spineConfig.backgroundColor,
          }"
        >
          <span 
            class="whitespace-nowrap overflow-hidden text-ellipsis px-4"
            :style="{ fontSize: '14px' }"
          >
            <span :style="{ color: spineConfig.artistColor || spineConfig.textColor, fontWeight: spineConfig.artistBold ? 'bold' : 'normal', fontStyle: spineConfig.artistItalic ? 'italic' : 'normal' }">{{ spineArtist }}</span>
            <span v-if="spineArtist && spineAlbum" :style="{ color: spineConfig.textColor }">{{ spineConfig.separator ?? ' - ' }}</span>
            <span :style="{ color: spineConfig.albumColor || spineConfig.textColor, fontWeight: spineConfig.albumBold ? 'bold' : 'normal', fontStyle: spineConfig.albumItalic ? 'italic' : 'normal' }">{{ spineAlbum }}</span>
          </span>
        </div>
      </div>
    </div>
    
    <!-- Download Button -->
    <div class="flex justify-center pt-4">
      <button
        @click="handleDownload"
        :disabled="!frontCover && !backCover"
        class="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Download PDF
      </button>
    </div>
    
    <!-- Fullscreen Modal -->
    <Teleport to="body">
      <div 
        v-if="fullscreenView"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        @click="closeFullscreen"
      >
        <div class="relative max-w-[90vw] max-h-[90vh] p-4" @click.stop>
          <!-- Close button -->
          <button
            @click="closeFullscreen"
            class="absolute -top-2 -right-2 z-10 w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <!-- Front Cover Fullscreen -->
          <div v-if="fullscreenView === 'front'" class="bg-white dark:bg-gray-700 shadow-2xl rounded-lg overflow-hidden">
            <p class="text-center text-sm text-gray-600 dark:text-gray-300 py-2 bg-gray-50 dark:bg-gray-800">
              Front Cover (120 x 120 mm)
            </p>
            <div 
              class="relative"
              :style="{ width: fullscreenFrontSize + 'px', height: fullscreenFrontSize + 'px' }"
            >
              <img 
                v-if="frontCover" 
                :src="frontCover" 
                alt="Front cover preview"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
                <span>No front cover</span>
              </div>
            </div>
          </div>
          
          <!-- Back Inlay Fullscreen -->
          <div v-if="fullscreenView === 'back'" class="bg-white dark:bg-gray-700 shadow-2xl rounded-lg overflow-hidden">
            <p class="text-center text-sm text-gray-600 dark:text-gray-300 py-2 bg-gray-50 dark:bg-gray-800">
              Back Inlay (150 x 118 mm)
            </p>
            <div 
              class="relative flex overflow-hidden"
              :style="{ width: fullscreenBackWidth + 'px', height: fullscreenBackHeight + 'px' }"
            >
              <!-- Left Spine -->
              <div 
                v-if="!backImageIncludesSpines || !backCover"
                class="flex-shrink-0 relative overflow-hidden"
                :style="{ 
                  width: fullscreenSpineWidth + 'px',
                  backgroundColor: spineConfig.backgroundColor,
                }"
              >
                <div 
                  class="absolute whitespace-nowrap"
                  :style="fullscreenLeftSpineTextStyle"
                >
                  <span :style="{ color: spineConfig.artistColor || spineConfig.textColor, fontWeight: spineConfig.artistBold ? 'bold' : 'normal', fontStyle: spineConfig.artistItalic ? 'italic' : 'normal' }">{{ spineArtist }}</span><span v-if="spineArtist && spineAlbum" :style="{ color: spineConfig.textColor }">{{ spineConfig.separator ?? ' - ' }}</span><span :style="{ color: spineConfig.albumColor || spineConfig.textColor, fontWeight: spineConfig.albumBold ? 'bold' : 'normal', fontStyle: spineConfig.albumItalic ? 'italic' : 'normal' }">{{ spineAlbum }}</span>
                </div>
              </div>
              
              <!-- Center / Full Back -->
              <div 
                class="flex-1 relative overflow-hidden flex"
                :style="backImageIncludesSpines ? {} : { backgroundColor: centerBackgroundColor }"
              >
                <div 
                  v-if="!backImageIncludesSpines && backCover"
                  class="absolute left-0 top-0 bottom-0 w-1/2"
                  :style="{ backgroundColor: leftEdgeColor }"
                ></div>
                <div 
                  v-if="!backImageIncludesSpines && backCover"
                  class="absolute right-0 top-0 bottom-0 w-1/2"
                  :style="{ backgroundColor: rightEdgeColor }"
                ></div>
                <img 
                  v-if="backCover" 
                  :src="backCover" 
                  alt="Back cover preview"
                  :class="[
                    'relative z-10 m-auto',
                    backImageIncludesSpines ? 'w-full h-full object-cover' : 'max-w-full max-h-full object-contain'
                  ]"
                />
                <div 
                  v-else 
                  class="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50 dark:bg-gray-600"
                >
                  <span>No back cover</span>
                </div>
              </div>
              
              <!-- Right Spine -->
              <div 
                v-if="!backImageIncludesSpines || !backCover"
                class="flex-shrink-0 relative overflow-hidden"
                :style="{ 
                  width: fullscreenSpineWidth + 'px',
                  backgroundColor: spineConfig.backgroundColor,
                }"
              >
                <div 
                  class="absolute whitespace-nowrap"
                  :style="fullscreenRightSpineTextStyle"
                >
                  <span :style="{ color: spineConfig.artistColor || spineConfig.textColor, fontWeight: spineConfig.artistBold ? 'bold' : 'normal', fontStyle: spineConfig.artistItalic ? 'italic' : 'normal' }">{{ spineArtist }}</span><span v-if="spineArtist && spineAlbum" :style="{ color: spineConfig.textColor }">{{ spineConfig.separator ?? ' - ' }}</span><span :style="{ color: spineConfig.albumColor || spineConfig.textColor, fontWeight: spineConfig.albumBold ? 'bold' : 'normal', fontStyle: spineConfig.albumItalic ? 'italic' : 'normal' }">{{ spineAlbum }}</span>
                </div>
              </div>
              
              <!-- Fold lines overlay -->
              <template v-if="backImageIncludesSpines && backCover">
                <div 
                  class="absolute top-0 bottom-0 border-l-2 border-dashed border-gray-400"
                  :style="{ left: fullscreenSpineWidth + 'px' }"
                ></div>
                <div 
                  class="absolute top-0 bottom-0 border-l-2 border-dashed border-gray-400"
                  :style="{ right: fullscreenSpineWidth + 'px' }"
                ></div>
              </template>
            </div>
          </div>
          
          <!-- Navigation hint -->
          <p class="text-center text-sm text-gray-400 mt-4">Press ESC or click outside to close</p>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { DIMENSIONS } from '../utils/dimensions.js'
import { usePdfExport } from '../composables/usePdfExport.js'

const props = defineProps({
  frontCover: String,
  backCover: String,
  backImageIncludesSpines: {
    type: Boolean,
    default: true
  },
  spineConfig: {
    type: Object,
    default: () => ({
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
  },
  artistName: {
    type: String,
    default: ''
  },
  albumName: {
    type: String,
    default: ''
  },
  warnings: {
    type: Array,
    default: () => []
  },
  leftEdgeColor: {
    type: String,
    default: '#000000'
  },
  rightEdgeColor: {
    type: String,
    default: '#000000'
  }
})

const emit = defineEmits(['download'])

const { downloadPdf } = usePdfExport()

// Preview scaling (showing mm as pixels at reduced scale)
const previewScale = 1.5 // 1mm = 1.5px in preview

const frontPreviewSize = computed(() => DIMENSIONS.front.width * previewScale)
const backPreviewWidth = computed(() => DIMENSIONS.back.width * previewScale)
const backPreviewHeight = computed(() => DIMENSIONS.back.height * previewScale)
const spinePreviewWidth = computed(() => DIMENSIONS.spine.width * previewScale)

const spineText = computed(() => {
  const artist = props.spineConfig.artistName || props.artistName
  const album = props.spineConfig.albumName || props.albumName
  const separator = props.spineConfig.separator ?? ' - '
  
  let text = ''
  if (artist && album) {
    text = `${artist}${separator}${album}`
  } else {
    text = artist || album || ''
  }
  
  return text
})

// Get rotation label for spine preview
const rotationLabel = computed(() => {
  const left = props.spineConfig.leftRotation === 'bottom-to-top' ? '↑' : '↓'
  const right = props.spineConfig.rightRotation === 'top-to-bottom' ? '↓' : '↑'
  return `Left: ${left} Right: ${right}`
})

// Individual spine parts for colored display
const spineArtist = computed(() => props.spineConfig.artistName || props.artistName)
const spineAlbum = computed(() => props.spineConfig.albumName || props.albumName)

// Spine text rotation styles for back inlay preview
const leftSpineTextStyle = computed(() => {
  const rotation = props.spineConfig.leftRotation === 'bottom-to-top' ? -90 : 90
  const fontSize = Math.max(5, spinePreviewWidth.value * 0.7)
  return {
    fontSize: fontSize + 'px',
    transform: `rotate(${rotation}deg)`,
    transformOrigin: 'center center',
    left: '50%',
    top: '50%',
    translate: '-50% -50%',
  }
})

const rightSpineTextStyle = computed(() => {
  const rotation = props.spineConfig.rightRotation === 'top-to-bottom' ? 90 : -90
  const fontSize = Math.max(5, spinePreviewWidth.value * 0.7)
  return {
    fontSize: fontSize + 'px',
    transform: `rotate(${rotation}deg)`,
    transformOrigin: 'center center',
    left: '50%',
    top: '50%',
    translate: '-50% -50%',
  }
})

// Fullscreen preview
const fullscreenView = ref(null) // 'front' | 'back' | null
const fullscreenScale = 3 // Larger scale for fullscreen

const fullscreenFrontSize = computed(() => DIMENSIONS.front.width * fullscreenScale)
const fullscreenBackWidth = computed(() => DIMENSIONS.back.width * fullscreenScale)
const fullscreenBackHeight = computed(() => DIMENSIONS.back.height * fullscreenScale)
const fullscreenSpineWidth = computed(() => DIMENSIONS.spine.width * fullscreenScale)

const fullscreenLeftSpineTextStyle = computed(() => {
  const rotation = props.spineConfig.leftRotation === 'bottom-to-top' ? -90 : 90
  const fontSize = Math.max(8, fullscreenSpineWidth.value * 0.7)
  return {
    fontSize: fontSize + 'px',
    transform: `rotate(${rotation}deg)`,
    transformOrigin: 'center center',
    left: '50%',
    top: '50%',
    translate: '-50% -50%',
  }
})

const fullscreenRightSpineTextStyle = computed(() => {
  const rotation = props.spineConfig.rightRotation === 'top-to-bottom' ? 90 : -90
  const fontSize = Math.max(8, fullscreenSpineWidth.value * 0.7)
  return {
    fontSize: fontSize + 'px',
    transform: `rotate(${rotation}deg)`,
    transformOrigin: 'center center',
    left: '50%',
    top: '50%',
    translate: '-50% -50%',
  }
})

const openFullscreen = (view) => {
  fullscreenView.value = view
}

const closeFullscreen = () => {
  fullscreenView.value = null
}

const handleKeydown = (e) => {
  if (e.key === 'Escape' && fullscreenView.value) {
    closeFullscreen()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// Calculate font size to fit text in spine, with minimum size limit
const spineFontSize = computed(() => {
  const text = spineText.value
  if (!text) return props.spineConfig.fontSize * previewScale
  
  // Available height for text (spine height minus padding: 4px top + 4px bottom = 8px)
  const availableHeight = backPreviewHeight.value - 16 // More padding for visual comfort
  
  // Approximate character width ratio (varies by font, ~0.6 for helvetica)
  const charWidthRatio = 0.55
  
  // Start with configured font size
  let fontSize = props.spineConfig.fontSize * previewScale
  
  // Calculate text width at this font size
  let textWidth = text.length * fontSize * charWidthRatio
  
  // If text is too wide, scale down the font
  if (textWidth > availableHeight) {
    fontSize = availableHeight / (text.length * charWidthRatio)
  }
  
  // Minimum font size of 5px - below this we'd truncate instead
  return Math.max(5, fontSize)
})

// Only truncate if font would be too small
const displaySpineText = computed(() => {
  const text = spineText.value
  if (!text) return ''
  
  const availableHeight = backPreviewHeight.value - 16 // Match padding above
  const charWidthRatio = 0.55
  const minFontSize = 5
  
  // Calculate how many chars fit at minimum font size
  const maxChars = Math.floor(availableHeight / (minFontSize * charWidthRatio))
  
  if (text.length > maxChars) {
    return text.substring(0, maxChars - 3) + '...'
  }
  return text
})

// Use average of edge colors for center background (fallback)
const centerBackgroundColor = computed(() => {
  // Average the left and right edge colors
  const left = props.leftEdgeColor || '#000000'
  const right = props.rightEdgeColor || '#000000'
  
  const l = left.replace('#', '')
  const r = right.replace('#', '')
  
  const avgR = Math.round((parseInt(l.substr(0, 2), 16) + parseInt(r.substr(0, 2), 16)) / 2)
  const avgG = Math.round((parseInt(l.substr(2, 2), 16) + parseInt(r.substr(2, 2), 16)) / 2)
  const avgB = Math.round((parseInt(l.substr(4, 2), 16) + parseInt(r.substr(4, 2), 16)) / 2)
  
  return '#' + [avgR, avgG, avgB].map(c => c.toString(16).padStart(2, '0')).join('')
})

const handleDownload = async () => {
  const filename = generateFilename()
  
  await downloadPdf({
    frontCover: props.frontCover,
    backCover: props.backCover,
    backImageIncludesSpines: props.backImageIncludesSpines,
    spineConfig: props.spineConfig,
    artistName: props.artistName,
    albumName: props.albumName,
    leftEdgeColor: props.leftEdgeColor,
    rightEdgeColor: props.rightEdgeColor,
  }, filename)
  
  emit('download')
}

const generateFilename = () => {
  const artist = props.spineConfig.artistName || props.artistName || ''
  const album = props.spineConfig.albumName || props.albumName || ''
  
  if (artist && album) {
    return `${sanitizeFilename(artist)} - ${sanitizeFilename(album)} - CD Inlay.pdf`
  } else if (artist || album) {
    return `${sanitizeFilename(artist || album)} - CD Inlay.pdf`
  }
  return 'CD Inlay.pdf'
}

const sanitizeFilename = (str) => {
  return str.replace(/[<>:"/\\|?*]/g, '').trim()
}
</script>
