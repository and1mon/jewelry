// PDF Export composable using jsPDF
// Generates printable CD inlay PDFs with proper dimensions

import { jsPDF } from 'jspdf'
import { DIMENSIONS, PDF_MARGINS, mmToPoints } from '../utils/dimensions.js'

/**
 * Parse hex color to RGB values
 */
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (result) {
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    }
  }
  return { r: 0, g: 0, b: 0 }
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
 * Calculate dimensions to fit image within a box while maintaining aspect ratio
 */
const fitImageInBox = (imgWidth, imgHeight, boxWidth, boxHeight) => {
  const imgRatio = imgWidth / imgHeight
  const boxRatio = boxWidth / boxHeight
  
  let finalWidth, finalHeight, offsetX, offsetY
  
  if (imgRatio > boxRatio) {
    // Image is wider than box - fit to width
    finalWidth = boxWidth
    finalHeight = boxWidth / imgRatio
    offsetX = 0
    offsetY = (boxHeight - finalHeight) / 2
  } else {
    // Image is taller than box - fit to height
    finalHeight = boxHeight
    finalWidth = boxHeight * imgRatio
    offsetX = (boxWidth - finalWidth) / 2
    offsetY = 0
  }
  
  return { width: finalWidth, height: finalHeight, offsetX, offsetY }
}

/**
 * Draw dashed cut lines around a rectangle
 */
const drawCutLines = (doc, x, y, width, height, extension = 5) => {
  doc.setDrawColor(128, 128, 128)
  doc.setLineDashPattern([2, 2], 0)
  doc.setLineWidth(0.3)
  
  // Top line with extensions
  doc.line(x - extension, y, x + width + extension, y)
  // Bottom line with extensions
  doc.line(x - extension, y + height, x + width + extension, y + height)
  // Left line with extensions
  doc.line(x, y - extension, x, y + height + extension)
  // Right line with extensions
  doc.line(x + width, y - extension, x + width, y + height + extension)
  
  // Reset dash pattern
  doc.setLineDashPattern([], 0)
}

/**
 * Draw fold lines for spine areas
 */
const drawFoldLines = (doc, x, y, height) => {
  doc.setDrawColor(100, 100, 100)
  doc.setLineDashPattern([1, 1], 0)
  doc.setLineWidth(0.2)
  
  doc.line(x, y, x, y + height)
  
  doc.setLineDashPattern([], 0)
}

/**
 * Draw vertical text (rotated) for spine, auto-sizing to fit
 * Supports separate colors for artist and album parts
 * @param {jsPDF} doc - The jsPDF document
 * @param {Object} textParts - Object with artist, separator, album text and colors
 * @param {number} x - X position (center of spine)
 * @param {number} y - Y position (top of spine area)
 * @param {number} height - Available height
 * @param {number} fontSize - Base font size
 * @param {string} alignment - Text alignment (top/center/bottom)
 * @param {number} angle - Rotation angle: -90 for bottom-to-top, 90 for top-to-bottom
 */
const drawSpineTextColored = (doc, textParts, x, y, height, fontSize, alignment = 'center', angle = -90) => {
  const { 
    artist, album, separator, 
    artistColor, albumColor, separatorColor,
    artistBold = false, artistItalic = false,
    albumBold = false, albumItalic = false
  } = textParts
  
  // Build full text
  const fullText = artist && album ? `${artist}${separator}${album}` : (artist || album || '')
  if (!fullText.trim()) return
  
  // Always use multi-color path when we have both artist and album
  // (even if colors are the same, to ensure consistent positioning)
  const useMultiColorPath = artist && album
  
  // Available height for text (with padding - 5mm on each end)
  const padding = 5
  const availableHeight = height - (padding * 2)
  
  // Helper to get jsPDF font style string
  const getFontStyle = (bold, italic) => {
    if (bold && italic) return 'bolditalic'
    if (bold) return 'bold'
    if (italic) return 'italic'
    return 'normal'
  }
  
  // Measure total text width considering different font styles
  const measureTotalWidth = (currentFontSize) => {
    doc.setFontSize(currentFontSize)
    if (!useMultiColorPath) {
      // Single text - use artist style if present, else album style
      const style = artist ? getFontStyle(artistBold, artistItalic) : getFontStyle(albumBold, albumItalic)
      doc.setFont('helvetica', style)
      return doc.getTextWidth(fullText)
    }
    // Multi-color: measure each part with its own style
    doc.setFont('helvetica', getFontStyle(artistBold, artistItalic))
    const artistWidth = doc.getTextWidth(artist)
    doc.setFont('helvetica', 'normal')
    const separatorWidth = doc.getTextWidth(separator)
    doc.setFont('helvetica', getFontStyle(albumBold, albumItalic))
    const albumWidth = doc.getTextWidth(album)
    return artistWidth + separatorWidth + albumWidth
  }
  
  // Start with requested font size and measure
  let currentFontSize = fontSize
  let totalTextWidth = measureTotalWidth(currentFontSize)
  
  // Scale down font size if text is too long
  if (totalTextWidth > availableHeight) {
    currentFontSize = (availableHeight / totalTextWidth) * fontSize
    currentFontSize = Math.max(4, currentFontSize)
    totalTextWidth = measureTotalWidth(currentFontSize)
  }
  
  // Calculate Y position for text start
  // IMPORTANT: jsPDF with angle -90 draws text DOWNWARD (increasing Y) from anchor
  //            jsPDF with angle 90 draws text UPWARD (decreasing Y) from anchor
  let textY
  if (angle === -90) {
    // Bottom to top READING direction, but text DRAWS downward from anchor
    // So anchor should be at TOP of where we want text to appear
    switch (alignment) {
      case 'top':
        textY = y + padding
        break
      case 'bottom':
        textY = y + height - padding - totalTextWidth
        break
      case 'center':
      default:
        textY = y + (height / 2) - (totalTextWidth / 2)
        break
    }
  } else {
    // Top to bottom READING direction (angle 90), text DRAWS upward from anchor
    // So anchor should be at BOTTOM of where we want text to appear
    switch (alignment) {
      case 'top':
        textY = y + padding + totalTextWidth
        break
      case 'bottom':
        textY = y + height - padding
        break
      case 'center':
      default:
        textY = y + (height / 2) + (totalTextWidth / 2)
        break
    }
  }
  
  doc.saveGraphicsState()
  doc.setFontSize(currentFontSize)
  
  // Calculate X offset for horizontal centering of rotated text
  // jsPDF draws text from the baseline position. When rotated:
  // - At angle 90: text reads bottom-to-top, baseline on RIGHT, text extends LEFT
  // - At angle -90: text reads top-to-bottom, baseline on LEFT, text extends RIGHT
  // 
  // Font size is in points, convert to mm: 1pt = 0.352778mm
  // Cap height is approximately 70% of em height
  const fontSizeMm = currentFontSize * 0.352778
  const capHeightMm = fontSizeMm * 0.7
  let adjustedX = x
  
  if (angle === 90) {
    // Text extends LEFT from baseline at x, move x RIGHT to center
    adjustedX = x + capHeightMm / 2
  } else {
    // Text extends RIGHT from baseline at x, move x LEFT to center
    adjustedX = x - capHeightMm / 2
  }
  
  // Use multi-color path when we have both artist and album
  if (!useMultiColorPath) {
    // Single text (only artist OR only album)
    const color = artistColor || albumColor || separatorColor
    const rgb = hexToRgb(color)
    const style = artist ? getFontStyle(artistBold, artistItalic) : getFontStyle(albumBold, albumItalic)
    doc.setFont('helvetica', style)
    doc.setTextColor(rgb.r, rgb.g, rgb.b)
    doc.text(fullText, adjustedX, textY, { angle: angle })
  } else {
    // Different colors/styles - draw each segment
    // Get individual widths with their styles
    doc.setFont('helvetica', getFontStyle(artistBold, artistItalic))
    const artistWidth = doc.getTextWidth(artist)
    doc.setFont('helvetica', 'normal')
    const separatorWidth = doc.getTextWidth(separator)
    doc.setFont('helvetica', getFontStyle(albumBold, albumItalic))
    const albumWidth = doc.getTextWidth(album)
    
    if (angle === -90) {
      // Text DRAWS downward from anchor, READS bottom-to-top
      // Artist first (at top/lowest Y), then separator, then album (at bottom/highest Y)
      let currentY = textY
      
      // Artist (reads first from bottom, but drawn first at top)
      const artistRgb = hexToRgb(artistColor)
      doc.setFont('helvetica', getFontStyle(artistBold, artistItalic))
      doc.setTextColor(artistRgb.r, artistRgb.g, artistRgb.b)
      doc.text(artist, adjustedX, currentY, { angle: angle })
      currentY += artistWidth
      
      // Separator
      const sepRgb = hexToRgb(separatorColor)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(sepRgb.r, sepRgb.g, sepRgb.b)
      doc.text(separator, adjustedX, currentY, { angle: angle })
      currentY += separatorWidth
      
      // Album (reads last from bottom, drawn last at bottom)
      const albumRgb = hexToRgb(albumColor)
      doc.setFont('helvetica', getFontStyle(albumBold, albumItalic))
      doc.setTextColor(albumRgb.r, albumRgb.g, albumRgb.b)
      doc.text(album, adjustedX, currentY, { angle: angle })
    } else {
      // Angle 90: Text DRAWS upward from anchor, READS top-to-bottom
      // Artist first (at bottom/highest Y), then separator, then album (at top/lowest Y)
      let currentY = textY
      
      // Artist (reads first from top, but drawn first at bottom)
      const artistRgb = hexToRgb(artistColor)
      doc.setFont('helvetica', getFontStyle(artistBold, artistItalic))
      doc.setTextColor(artistRgb.r, artistRgb.g, artistRgb.b)
      doc.text(artist, adjustedX, currentY, { angle: angle })
      currentY -= artistWidth
      
      // Separator
      const sepRgb = hexToRgb(separatorColor)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(sepRgb.r, sepRgb.g, sepRgb.b)
      doc.text(separator, adjustedX, currentY, { angle: angle })
      currentY -= separatorWidth
      
      // Album (reads last from top, drawn last at top)
      const albumRgb = hexToRgb(albumColor)
      doc.setFont('helvetica', getFontStyle(albumBold, albumItalic))
      doc.setTextColor(albumRgb.r, albumRgb.g, albumRgb.b)
      doc.text(album, adjustedX, currentY, { angle: angle })
    }
  }
  
  doc.restoreGraphicsState()
}

/**
 * Legacy function for backwards compatibility
 * Draw vertical text (rotated) for spine, auto-sizing to fit
 * @param {number} angle - Rotation angle: -90 for bottom-to-top, 90 for top-to-bottom
 */
const drawSpineText = (doc, text, x, y, height, fontSize, alignment = 'center', angle = -90) => {
  if (!text || !text.trim()) return
  
  // Available height for text (with padding - 5mm on each end)
  const padding = 5
  const availableHeight = height - (padding * 2)
  
  // Start with requested font size and measure
  let currentFontSize = fontSize
  doc.setFontSize(currentFontSize)
  let textWidth = doc.getTextWidth(text)
  
  // Scale down font size if text is too long
  if (textWidth > availableHeight) {
    currentFontSize = (availableHeight / textWidth) * fontSize
    // Minimum font size of 4pt
    currentFontSize = Math.max(4, currentFontSize)
    doc.setFontSize(currentFontSize)
    textWidth = doc.getTextWidth(text)
  }
  
  // If still too long at minimum size, truncate
  let displayText = text
  if (textWidth > availableHeight) {
    while (doc.getTextWidth(displayText + '...') > availableHeight && displayText.length > 3) {
      displayText = displayText.slice(0, -1)
    }
    displayText = displayText + '...'
    textWidth = doc.getTextWidth(displayText)
  }
  
  // Calculate text position based on alignment and rotation direction
  // IMPORTANT: jsPDF with angle -90 draws text DOWNWARD (increasing Y) from anchor
  //            jsPDF with angle 90 draws text UPWARD (decreasing Y) from anchor
  let textY
  
  if (angle === -90) {
    // Text draws downward, reads bottom-to-top
    // Anchor at TOP of text area
    switch (alignment) {
      case 'top':
        textY = y + padding
        break
      case 'bottom':
        textY = y + height - padding - textWidth
        break
      case 'center':
      default:
        textY = y + (height / 2) - (textWidth / 2)
        break
    }
  } else {
    // Text draws upward (angle 90), reads top-to-bottom
    // Anchor at BOTTOM of text area
    switch (alignment) {
      case 'top':
        textY = y + padding + textWidth
        break
      case 'bottom':
        textY = y + height - padding
        break
      case 'center':
      default:
        textY = y + (height / 2) + (textWidth / 2)
        break
    }
  }
  
  // Save current state
  doc.saveGraphicsState()
  
  // Rotate and draw text
  doc.text(displayText, x, textY, { angle: angle })
  
  doc.restoreGraphicsState()
}

export function usePdfExport() {
  
  /**
   * Generate a PDF with front cover and back inlay
   * @param {Object} options
   * @param {string} options.frontCover - Data URL of front cover image
   * @param {string} options.backCover - Data URL of back cover image (optional)
   * @param {boolean} options.backImageIncludesSpines - Whether back image already has spines
   * @param {Object} options.spineConfig - Spine configuration if not included in image
   * @param {string} options.spineConfig.backgroundColor - Background color for spine
   * @param {string} options.spineConfig.textColor - Text color for spine
   * @param {string} options.spineConfig.artistName - Artist name for spine
   * @param {string} options.spineConfig.artistColor - Artist text color (optional)
   * @param {string} options.spineConfig.albumName - Album name for spine
   * @param {string} options.spineConfig.albumColor - Album text color (optional)
   * @param {string} options.spineConfig.separator - Separator between artist and album
   * @param {string} options.spineConfig.alignment - Text alignment (top/center/bottom)
   * @param {number} options.spineConfig.fontSize - Font size for spine text
   * @param {string} options.spineConfig.leftRotation - Left spine rotation (bottom-to-top/top-to-bottom)
   * @param {string} options.spineConfig.rightRotation - Right spine rotation (bottom-to-top/top-to-bottom)
   * @param {string} options.artistName - Artist name (fallback for spine)
   * @param {string} options.albumName - Album name (fallback for spine)
   * @param {string} options.leftEdgeColor - Left edge color for filling gaps
   * @param {string} options.rightEdgeColor - Right edge color for filling gaps
   */
  const generatePdf = async (options) => {
    const {
      frontCover,
      backCover,
      backImageIncludesSpines = true,
      spineConfig = {},
      artistName = '',
      albumName = '',
      leftEdgeColor = '#000000',
      rightEdgeColor = '#000000',
    } = options
    
    // Create A4 PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })
    
    // Set up fonts
    doc.setFont('helvetica')
    
    // Calculate positions
    const frontX = PDF_MARGINS.left
    const frontY = PDF_MARGINS.top
    
    const backX = PDF_MARGINS.left
    const backY = frontY + DIMENSIONS.front.height + PDF_MARGINS.spaceBetween
    
    // Add title
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text('CD Inlay Generator - Cut along dashed lines, fold along dotted lines', PDF_MARGINS.left, 8)
    
    // Draw front cover
    if (frontCover) {
      try {
        doc.addImage(
          frontCover,
          'JPEG',
          frontX,
          frontY,
          DIMENSIONS.front.width,
          DIMENSIONS.front.height
        )
      } catch (e) {
        console.error('Failed to add front cover to PDF:', e)
      }
    } else {
      // Draw placeholder
      doc.setFillColor(240, 240, 240)
      doc.rect(frontX, frontY, DIMENSIONS.front.width, DIMENSIONS.front.height, 'F')
      doc.setTextColor(150, 150, 150)
      doc.setFontSize(12)
      doc.text('Front Cover', frontX + DIMENSIONS.front.width / 2, frontY + DIMENSIONS.front.height / 2, { align: 'center' })
    }
    
    // Draw cut lines for front cover
    drawCutLines(doc, frontX, frontY, DIMENSIONS.front.width, DIMENSIONS.front.height)
    
    // Label
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('FRONT COVER (120 x 120 mm)', frontX, frontY - 2)
    
    // Draw back inlay
    if (backCover && backImageIncludesSpines) {
      // Back image includes spines - just draw it at full size
      try {
        doc.addImage(
          backCover,
          'JPEG',
          backX,
          backY,
          DIMENSIONS.back.width,
          DIMENSIONS.back.height
        )
      } catch (e) {
        console.error('Failed to add back cover to PDF:', e)
      }
    } else {
      // Need to construct back inlay with separate spines
      const spine = spineConfig.backgroundColor ? spineConfig : {
        backgroundColor: '#000000',
        textColor: '#ffffff',
        artistName: artistName,
        albumName: albumName,
        alignment: 'center',
        fontSize: 7,
      }
      
      // Draw left spine background
      const leftSpineX = backX
      const spineBgColor = hexToRgb(spine.backgroundColor)
      doc.setFillColor(spineBgColor.r, spineBgColor.g, spineBgColor.b)
      doc.rect(leftSpineX, backY, DIMENSIONS.spine.width, DIMENSIONS.spine.height, 'F')
      
      // Draw center back area
      const centerX = backX + DIMENSIONS.spine.width
      if (backCover) {
        try {
          // Get actual image dimensions to fit properly (not stretch)
          const imgDims = await getImageDimensions(backCover)
          const fit = fitImageInBox(
            imgDims.width, 
            imgDims.height, 
            DIMENSIONS.backCenter.width, 
            DIMENSIONS.backCenter.height
          )
          
          // Fill left half with left edge color, right half with right edge color
          // This creates a seamless blend when the image is letterboxed
          const leftEdgeRgb = hexToRgb(leftEdgeColor)
          const rightEdgeRgb = hexToRgb(rightEdgeColor)
          
          doc.setFillColor(leftEdgeRgb.r, leftEdgeRgb.g, leftEdgeRgb.b)
          doc.rect(centerX, backY, DIMENSIONS.backCenter.width / 2, DIMENSIONS.backCenter.height, 'F')
          
          doc.setFillColor(rightEdgeRgb.r, rightEdgeRgb.g, rightEdgeRgb.b)
          doc.rect(centerX + DIMENSIONS.backCenter.width / 2, backY, DIMENSIONS.backCenter.width / 2, DIMENSIONS.backCenter.height, 'F')
          
          // Draw image fitted within the center area
          doc.addImage(
            backCover,
            'JPEG',
            centerX + fit.offsetX,
            backY + fit.offsetY,
            fit.width,
            fit.height
          )
        } catch (e) {
          console.error('Failed to add back center to PDF:', e)
        }
      } else {
        // Draw placeholder for center
        doc.setFillColor(240, 240, 240)
        doc.rect(centerX, backY, DIMENSIONS.backCenter.width, DIMENSIONS.backCenter.height, 'F')
        doc.setTextColor(150, 150, 150)
        doc.setFontSize(12)
        doc.text('Back Cover', centerX + DIMENSIONS.backCenter.width / 2, backY + DIMENSIONS.backCenter.height / 2, { align: 'center' })
      }
      
      // Draw right spine background
      const rightSpineX = backX + DIMENSIONS.spine.width + DIMENSIONS.backCenter.width
      doc.setFillColor(spineBgColor.r, spineBgColor.g, spineBgColor.b)
      doc.rect(rightSpineX, backY, DIMENSIONS.spine.width, DIMENSIONS.spine.height, 'F')
      
      // Draw spine text
      const spineTextColor = hexToRgb(spine.textColor)
      doc.setTextColor(spineTextColor.r, spineTextColor.g, spineTextColor.b)
      
      // Use spine config names, fall back to passed artistName/albumName
      const spineArtist = spine.artistName || artistName
      const spineAlbum = spine.albumName || albumName
      const separator = spine.separator ?? ' - '
      
      // Get rotation angles
      // -90 = bottom-to-top reading direction, 90 = top-to-bottom reading direction
      const leftRotation = spine.leftRotation || 'bottom-to-top'
      const rightRotation = spine.rightRotation || 'top-to-bottom'
      const leftAngle = leftRotation === 'bottom-to-top' ? 90 : -90
      const rightAngle = rightRotation === 'top-to-bottom' ? -90 : 90
      
      if (spineArtist || spineAlbum) {
        // Prepare text parts with colors and styles
        const textParts = {
          artist: spineArtist,
          album: spineAlbum,
          separator: separator,
          artistColor: spine.artistColor || spine.textColor,
          albumColor: spine.albumColor || spine.textColor,
          separatorColor: spine.textColor,
          artistBold: spine.artistBold || false,
          artistItalic: spine.artistItalic || false,
          albumBold: spine.albumBold || false,
          albumItalic: spine.albumItalic || false,
        }
        
        // Center X position for spine text (spine width / 2)
        const spineCenterOffset = DIMENSIONS.spine.width / 2
        
        // Left spine
        drawSpineTextColored(
          doc,
          textParts,
          leftSpineX + spineCenterOffset,
          backY,
          DIMENSIONS.spine.height,
          spine.fontSize,
          spine.alignment,
          leftAngle
        )
        
        // Right spine
        drawSpineTextColored(
          doc,
          textParts,
          rightSpineX + spineCenterOffset,
          backY,
          DIMENSIONS.spine.height,
          spine.fontSize,
          spine.alignment,
          rightAngle
        )
      }
      
      // Draw fold lines between spines and center
      drawFoldLines(doc, centerX, backY, DIMENSIONS.back.height)
      drawFoldLines(doc, rightSpineX, backY, DIMENSIONS.back.height)
    }
    
    // Draw cut lines for back inlay
    drawCutLines(doc, backX, backY, DIMENSIONS.back.width, DIMENSIONS.back.height)
    
    // If back image includes spines, still show fold guidelines
    if (backImageIncludesSpines) {
      drawFoldLines(doc, backX + DIMENSIONS.spine.width, backY, DIMENSIONS.back.height)
      drawFoldLines(doc, backX + DIMENSIONS.spine.width + DIMENSIONS.backCenter.width, backY, DIMENSIONS.back.height)
    }
    
    // Label
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('BACK INLAY (150 x 118 mm) - Fold at dotted lines', backX, backY - 2)
    
    // Add dimension annotations
    doc.setFontSize(6)
    doc.setTextColor(150, 150, 150)
    doc.text('6mm', backX + 3, backY + DIMENSIONS.back.height + 4)
    doc.text('138mm', backX + DIMENSIONS.spine.width + DIMENSIONS.backCenter.width / 2, backY + DIMENSIONS.back.height + 4, { align: 'center' })
    doc.text('6mm', backX + DIMENSIONS.back.width - 3, backY + DIMENSIONS.back.height + 4, { align: 'right' })
    
    return doc
  }
  
  /**
   * Generate and download PDF
   */
  const downloadPdf = async (options, filename = 'cd-inlay.pdf') => {
    const doc = await generatePdf(options)
    doc.save(filename)
  }
  
  /**
   * Generate PDF and return as blob URL for preview
   */
  const getPdfPreviewUrl = async (options) => {
    const doc = await generatePdf(options)
    const blob = doc.output('blob')
    return URL.createObjectURL(blob)
  }
  
  return {
    generatePdf,
    downloadPdf,
    getPdfPreviewUrl,
  }
}
