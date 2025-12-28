// Cover Art Archive API composable
// API docs: https://musicbrainz.org/doc/Cover_Art_Archive/API

import { ref } from 'vue'
import { DIMENSIONS } from '../utils/dimensions.js'

const CAA_BASE = 'https://coverartarchive.org'

// Expected aspect ratio for back cover WITH spines (150x118mm)
const BACK_WITH_SPINES_RATIO = DIMENSIONS.back.width / DIMENSIONS.back.height // ~1.27
// Expected aspect ratio for back cover WITHOUT spines (138x118mm) 
const BACK_WITHOUT_SPINES_RATIO = DIMENSIONS.backCenter.width / DIMENSIONS.backCenter.height // ~1.17
// Tolerance for aspect ratio matching
const RATIO_TOLERANCE = 0.08

/**
 * Fetch cover art information for a release
 * Returns list of available images with their types
 */
const fetchCoverArtInfo = async (mbid) => {
  const response = await fetch(`${CAA_BASE}/release/${mbid}`)
  
  if (response.status === 404) {
    return null // No cover art available
  }
  
  if (!response.ok) {
    throw new Error(`Cover Art Archive error: ${response.status}`)
  }
  
  return response.json()
}

/**
 * Get the best quality image URL from an image object
 */
const getBestImageUrl = (image) => {
  let url = null
  
  // Prefer original/full resolution, fall back to largest thumbnail
  if (image.image) {
    url = image.image // Original full resolution
  } else if (image.thumbnails) {
    // Try to get largest available
    url = image.thumbnails['1200'] || 
           image.thumbnails['large'] || 
           image.thumbnails['500'] ||
           image.thumbnails['small'] ||
           image.thumbnails['250']
  }
  
  // Force HTTPS - CAA sometimes returns HTTP URLs which get blocked by browsers
  if (url && url.startsWith('http://')) {
    url = url.replace('http://', 'https://')
  }
  
  return url
}

/**
 * Convert an image URL to a data URL (base64)
 * This handles CORS and allows embedding in PDF
 */
const imageUrlToDataUrl = async (url) => {
  const response = await fetch(url)
  const blob = await response.blob()
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Get image dimensions from a data URL
 */
const getImageDimensions = (dataUrl) => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
    }
    img.onerror = () => {
      resolve({ width: 0, height: 0 })
    }
    img.src = dataUrl
  })
}

/**
 * Detect if back cover image likely includes spines based on aspect ratio
 * Returns: 'with-spines', 'without-spines', or 'unknown'
 */
const detectBackCoverFormat = (width, height) => {
  if (width === 0 || height === 0) return 'unknown'
  
  const ratio = width / height
  
  // Check if it matches back WITH spines (wider ~1.27)
  if (Math.abs(ratio - BACK_WITH_SPINES_RATIO) <= RATIO_TOLERANCE) {
    return 'with-spines'
  }
  
  // Check if it matches back WITHOUT spines (~1.17 or squarer)
  if (Math.abs(ratio - BACK_WITHOUT_SPINES_RATIO) <= RATIO_TOLERANCE || ratio < BACK_WITHOUT_SPINES_RATIO) {
    return 'without-spines'
  }
  
  // If wider than expected with-spines ratio, probably still has spines
  if (ratio > BACK_WITH_SPINES_RATIO) {
    return 'with-spines'
  }
  
  return 'without-spines'
}

/**
 * Check if a color is very dark (likely letterbox/pillarbox bars)
 */
const isVeryDark = (r, g, b, threshold = 25) => {
  return r < threshold && g < threshold && b < threshold
}

/**
 * Check if a color is very light (likely letterbox/pillarbox bars)
 */
const isVeryLight = (r, g, b, threshold = 230) => {
  return r > threshold && g > threshold && b > threshold
}

/**
 * Extract the average color from a vertical strip of an image
 */
const sampleVerticalStrip = (ctx, x, width, height) => {
  const imageData = ctx.getImageData(x, 0, width, height)
  const pixels = imageData.data
  
  let totalR = 0, totalG = 0, totalB = 0
  const pixelCount = pixels.length / 4
  
  for (let i = 0; i < pixels.length; i += 4) {
    totalR += pixels[i]
    totalG += pixels[i + 1]
    totalB += pixels[i + 2]
  }
  
  return {
    r: Math.round(totalR / pixelCount),
    g: Math.round(totalG / pixelCount),
    b: Math.round(totalB / pixelCount)
  }
}

/**
 * Extract the representative edge color from an image
 * Smart enough to skip letterbox/pillarbox bars and sample actual content
 * @param {string} dataUrl - Image data URL
 * @param {string} edge - 'left' or 'right'
 * @returns {Promise<string>} - Hex color string
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
      
      const sampleWidth = Math.max(5, Math.floor(img.width * 0.01)) // 1% of width or 5px min
      const maxInset = Math.floor(img.width * 0.25) // Don't go more than 25% inward
      
      // Start from the edge and move inward if we detect letterboxing
      let inset = 0
      let color = null
      
      while (inset < maxInset) {
        const x = edge === 'left' 
          ? inset 
          : img.width - sampleWidth - inset
        
        color = sampleVerticalStrip(ctx, x, sampleWidth, img.height)
        
        // If not a letterbox color (very dark or very light), use it
        if (!isVeryDark(color.r, color.g, color.b) && !isVeryLight(color.r, color.g, color.b)) {
          break
        }
        
        // Move further inward
        inset += sampleWidth
      }
      
      // Convert to hex
      const hex = '#' + [color.r, color.g, color.b].map(c => c.toString(16).padStart(2, '0')).join('')
      resolve(hex)
    }
    img.onerror = () => {
      resolve('#000000') // Default to black on error
    }
    img.src = dataUrl
  })
}

/**
 * Get contrasting text color (black or white) for a given background
 */
const getContrastingTextColor = (hexColor) => {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  
  return luminance > 0.5 ? '#000000' : '#ffffff'
}

/**
 * Average two hex colors
 */
const averageColors = (hex1, hex2) => {
  const c1 = hex1.replace('#', '')
  const c2 = hex2.replace('#', '')
  
  const r = Math.round((parseInt(c1.substr(0, 2), 16) + parseInt(c2.substr(0, 2), 16)) / 2)
  const g = Math.round((parseInt(c1.substr(2, 2), 16) + parseInt(c2.substr(2, 2), 16)) / 2)
  const b = Math.round((parseInt(c1.substr(4, 2), 16) + parseInt(c2.substr(4, 2), 16)) / 2)
  
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')
}

export function useCoverArt() {
  const isLoading = ref(false)
  const error = ref(null)
  const coverArtInfo = ref(null)
  const frontCover = ref(null)
  const backCover = ref(null)
  const hasFrontCover = ref(false)
  const hasBackCover = ref(false)
  const backCoverFormat = ref('unknown') // 'with-spines', 'without-spines', 'unknown'
  const detectedSpineColor = ref('#000000')
  const detectedSpineTextColor = ref('#ffffff')
  const detectedLeftEdgeColor = ref('#000000')
  const detectedRightEdgeColor = ref('#000000')
  
  /**
   * Fetch all available cover art for a release
   * @param {string} mbid - MusicBrainz ID
   */
  const fetchCoverArt = async (mbid) => {
    isLoading.value = true
    error.value = null
    frontCover.value = null
    backCover.value = null
    hasFrontCover.value = false
    hasBackCover.value = false
    backCoverFormat.value = 'unknown'
    detectedSpineColor.value = '#000000'
    detectedSpineTextColor.value = '#ffffff'
    
    try {
      const info = await fetchCoverArtInfo(mbid)
      coverArtInfo.value = info
      
      if (!info || !info.images || info.images.length === 0) {
        error.value = 'No cover art available for this release'
        return
      }
      
      // Find front and back covers
      let frontImage = null
      let backImage = null
      
      for (const image of info.images) {
        const types = image.types || []
        
        if (types.includes('Front') && !frontImage) {
          frontImage = image
        }
        
        if (types.includes('Back') && !backImage) {
          backImage = image
        }
      }
      
      // If no specific front cover, use the first image
      if (!frontImage && info.images.length > 0) {
        frontImage = info.images[0]
      }
      
      // Fetch front cover
      if (frontImage) {
        const frontUrl = getBestImageUrl(frontImage)
        if (frontUrl) {
          try {
            frontCover.value = await imageUrlToDataUrl(frontUrl)
            hasFrontCover.value = true
          } catch (e) {
            error.value = `Failed to load front cover: ${e.message}`
          }
        }
      }
      
      // Fetch back cover
      if (backImage) {
        const backUrl = getBestImageUrl(backImage)
        if (backUrl) {
          try {
            backCover.value = await imageUrlToDataUrl(backUrl)
            hasBackCover.value = true
            
            // Detect format based on aspect ratio
            const dimensions = await getImageDimensions(backCover.value)
            backCoverFormat.value = detectBackCoverFormat(dimensions.width, dimensions.height)
            
            // If no spines, extract edge colors for generated spines
            if (backCoverFormat.value === 'without-spines') {
              const leftColor = await extractEdgeColor(backCover.value, 'left')
              const rightColor = await extractEdgeColor(backCover.value, 'right')
              detectedLeftEdgeColor.value = leftColor
              detectedRightEdgeColor.value = rightColor
              // Average the two edge colors for spine background
              const avgColor = averageColors(leftColor, rightColor)
              detectedSpineColor.value = avgColor
              detectedSpineTextColor.value = getContrastingTextColor(avgColor)
            }
          } catch (e) {
            // Back cover fetch failed silently - not critical
          }
        }
      }
      
      if (!hasFrontCover.value) {
        error.value = 'No front cover available'
      }
      
    } catch (err) {
      error.value = err.message
      coverArtInfo.value = null
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Set front cover from a file upload
   */
  const setFrontCoverFromFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        frontCover.value = e.target.result
        hasFrontCover.value = true
        resolve(e.target.result)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
  
  /**
   * Set back cover from a file upload
   */
  const setBackCoverFromFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        backCover.value = e.target.result
        hasBackCover.value = true
        
        // Detect format and extract colors
        try {
          const dimensions = await getImageDimensions(backCover.value)
          backCoverFormat.value = detectBackCoverFormat(dimensions.width, dimensions.height)
          
          if (backCoverFormat.value === 'without-spines') {
            const leftColor = await extractEdgeColor(backCover.value, 'left')
            const rightColor = await extractEdgeColor(backCover.value, 'right')
            detectedLeftEdgeColor.value = leftColor
            detectedRightEdgeColor.value = rightColor
            const avgColor = averageColors(leftColor, rightColor)
            detectedSpineColor.value = avgColor
            detectedSpineTextColor.value = getContrastingTextColor(avgColor)
          }
        } catch (err) {
          console.error('Error detecting back cover format:', err)
        }
        
        resolve(e.target.result)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
  
  /**
   * Clear all cover art
   */
  const clearCoverArt = () => {
    coverArtInfo.value = null
    frontCover.value = null
    backCover.value = null
    hasFrontCover.value = false
    hasBackCover.value = false
    backCoverFormat.value = 'unknown'
    detectedSpineColor.value = '#000000'
    detectedSpineTextColor.value = '#ffffff'
    detectedLeftEdgeColor.value = '#000000'
    detectedRightEdgeColor.value = '#000000'
    error.value = null
  }
  
  /**
   * Check if an image has sufficient resolution for printing
   */
  const checkImageQuality = async (dataUrl, requiredWidth, requiredHeight, minDpi = 150) => {
    const dimensions = await getImageDimensions(dataUrl)
    const minWidth = (requiredWidth / 25.4) * minDpi
    const minHeight = (requiredHeight / 25.4) * minDpi
    
    return {
      width: dimensions.width,
      height: dimensions.height,
      isAdequate: dimensions.width >= minWidth && dimensions.height >= minHeight,
      recommendedWidth: Math.ceil(minWidth),
      recommendedHeight: Math.ceil(minHeight),
    }
  }
  
  return {
    isLoading,
    error,
    coverArtInfo,
    frontCover,
    backCover,
    hasFrontCover,
    hasBackCover,
    backCoverFormat,
    detectedSpineColor,
    detectedSpineTextColor,
    detectedLeftEdgeColor,
    detectedRightEdgeColor,
    fetchCoverArt,
    setFrontCoverFromFile,
    setBackCoverFromFile,
    clearCoverArt,
    checkImageQuality,
    getImageDimensions,
  }
}
