/**
 * Image Processing Utility
 * Resizes and compresses uploaded profile images to crisp, lightweight Data URLs
 */

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Optimizes an image to a maximum dimension (e.g. 256x256) to ensure
 * fast rendering and minimal localStorage usage.
 */
export async function optimizeProfileImage(
  dataUrl: string,
  maxDimension = 256,
  quality = 0.88
): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      return resolve(dataUrl)
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      let width = img.width
      let height = img.height

      if (width <= maxDimension && height <= maxDimension && dataUrl.length < 50000) {
        return resolve(dataUrl)
      }

      // Calculate aspect-ratio preserving dimensions
      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width)
          width = maxDimension
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height)
          height = maxDimension
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        return resolve(dataUrl)
      }

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, width, height)

      try {
        const optimized = canvas.toDataURL('image/jpeg', quality)
        resolve(optimized)
      } catch {
        resolve(dataUrl)
      }
    }

    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

/**
 * Generates Google Profile Picture fallback based on email / name
 */
export function getGoogleProfileImageUrl(email: string, name: string): string {
  if (email && email.toLowerCase().includes('@gmail.com')) {
    return `https://unavatar.io/google/${encodeURIComponent(email.trim().toLowerCase())}`
  }
  const cleanName = name || 'Google User'
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}&backgroundColor=4285f4&textColor=ffffff`
}
