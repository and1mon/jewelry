// CD Jewel Case dimensions in millimeters
// Based on standard jewel case specifications

export const DIMENSIONS = {
  // Front cover (booklet) - fits behind front tabs
  front: {
    width: 120,
    height: 120,
  },
  
  // Back inlay (tray card) - total dimensions including spines
  back: {
    width: 150,    // Total width including both spines
    height: 118,   // Height of the inlay
  },
  
  // Spine dimensions (the folded edges on each side)
  spine: {
    width: 6,      // Each spine is 6mm wide
    height: 118,   // Same as back inlay height
  },
  
  // Center portion of back inlay (visible back when in case)
  backCenter: {
    width: 138,    // 150 - (2 * 6) = 138mm
    height: 118,
  },
  
  // A4 page dimensions for PDF
  a4: {
    width: 210,
    height: 297,
  },
}

// Convert mm to points (for PDF generation)
// 1 inch = 72 points, 1 inch = 25.4mm
export const mmToPoints = (mm) => (mm / 25.4) * 72

// Convert mm to pixels at a given DPI
export const mmToPixels = (mm, dpi = 300) => (mm / 25.4) * dpi

// Minimum recommended image resolution for print quality
export const MIN_PRINT_DPI = 150
export const IDEAL_PRINT_DPI = 300

// Calculate minimum pixel dimensions for good print quality
export const getMinimumPixels = (mm, dpi = MIN_PRINT_DPI) => Math.ceil(mmToPixels(mm, dpi))

export const MINIMUM_IMAGE_SIZE = {
  front: {
    width: getMinimumPixels(DIMENSIONS.front.width),
    height: getMinimumPixels(DIMENSIONS.front.height),
  },
  back: {
    width: getMinimumPixels(DIMENSIONS.back.width),
    height: getMinimumPixels(DIMENSIONS.back.height),
  },
}

// PDF layout margins (mm from edge of A4)
export const PDF_MARGINS = {
  top: 15,
  left: 15,
  spaceBetween: 10, // Space between front and back on the page
}
