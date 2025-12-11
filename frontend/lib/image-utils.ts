/**
 * Image optimization utilities for Next.js Image component
 *
 * All images MUST use Next.js Image component for automatic optimization.
 * This file provides utilities and examples for proper image usage.
 */

import type { ImageProps } from 'next/image'

/**
 * Standard image sizes for responsive images
 */
export const IMAGE_SIZES = {
  thumbnail: { width: 64, height: 64 },
  small: { width: 128, height: 128 },
  medium: { width: 256, height: 256 },
  large: { width: 512, height: 512 },
  hero: { width: 1920, height: 1080 },
} as const

/**
 * Image quality presets
 */
export const IMAGE_QUALITY = {
  low: 50,
  medium: 75,
  high: 90,
  max: 100,
} as const

/**
 * Get optimized image props for common use cases
 */
export const getOptimizedImageProps = (
  variant: keyof typeof IMAGE_SIZES,
  options: {
    priority?: boolean
    quality?: keyof typeof IMAGE_QUALITY
  } = {}
): Pick<ImageProps, 'width' | 'height' | 'priority' | 'quality'> => {
  const size = IMAGE_SIZES[variant]
  const quality = IMAGE_QUALITY[options.quality || 'medium']

  return {
    width: size.width,
    height: size.height,
    priority: options.priority || false,
    quality,
  }
}

/**
 * Example usage in components:
 *
 * 1. Static image (from /public):
 * ```tsx
 * import Image from 'next/image'
 * import { getOptimizedImageProps } from '@/lib/image-utils'
 *
 * <Image
 *   src="/logo.png"
 *   alt="Company logo"
 *   {...getOptimizedImageProps('medium')}
 * />
 * ```
 *
 * 2. Hero image (above the fold, high priority):
 * ```tsx
 * <Image
 *   src="/hero.jpg"
 *   alt="Hero image"
 *   {...getOptimizedImageProps('hero', { priority: true, quality: 'high' })}
 * />
 * ```
 *
 * 3. User avatar (small, lazy loaded):
 * ```tsx
 * <Image
 *   src={user.avatarUrl}
 *   alt={user.name}
 *   {...getOptimizedImageProps('small')}
 *   className="rounded-full"
 * />
 * ```
 *
 * 4. Responsive image with srcSet:
 * ```tsx
 * <Image
 *   src="/responsive.jpg"
 *   alt="Responsive image"
 *   sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
 *   fill
 *   style={{ objectFit: 'cover' }}
 * />
 * ```
 */

/**
 * Placeholder blur data URL generator
 * Use for smooth loading experience
 */
export const generatePlaceholder = (width: number = 10, height: number = 10): string => {
  // Returns a tiny blurred placeholder image as base64
  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null
  if (!canvas) return ''

  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  // Create gradient placeholder
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#f3f4f6')
  gradient.addColorStop(1, '#e5e7eb')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  return canvas.toDataURL()
}

/**
 * Image loading best practices:
 *
 * 1. **Above the fold images**: Set priority={true}
 *    - Hero images
 *    - Logo
 *    - Key CTAs
 *
 * 2. **Below the fold images**: Let Next.js lazy load (default)
 *    - Task thumbnails
 *    - User avatars
 *    - Gallery images
 *
 * 3. **Decorative images**: Use lower quality
 *    - Background patterns
 *    - Decorative elements
 *
 * 4. **High-quality images**: Use quality={90}
 *    - Product images
 *    - Portfolio work
 *    - Featured content
 *
 * 5. **Use appropriate formats**:
 *    - AVIF/WebP for modern browsers (automatic via Next.js)
 *    - Fallback to JPEG/PNG for older browsers
 *    - SVG for icons and logos
 */

/**
 * Performance checklist:
 * - [ ] All images use Next.js Image component
 * - [ ] Hero images have priority={true}
 * - [ ] Below-fold images are lazy loaded
 * - [ ] Images have proper alt text for accessibility
 * - [ ] Images have width and height to prevent layout shift
 * - [ ] Large images use responsive sizes
 * - [ ] Placeholder blur for smooth loading
 */
