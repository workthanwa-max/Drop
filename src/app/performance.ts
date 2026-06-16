import type { QualityProfile } from './types'

type NavigatorWithMemory = Navigator & {
  deviceMemory?: number
}

export function getInitialQualityProfile(): QualityProfile {
  const memory = (navigator as NavigatorWithMemory).deviceMemory ?? 4
  const cores = navigator.hardwareConcurrency ?? 4

  if (memory <= 4 || cores <= 4) {
    return 'performance'
  }

  if (memory >= 8 && cores >= 8) {
    return 'quality'
  }

  return 'balanced'
}

export function getVisionFps(profile: QualityProfile) {
  if (profile === 'performance') {
    return 24
  }

  if (profile === 'quality') {
    return 30
  }

  return 28
}

export function getCameraProfile(profile: QualityProfile) {
  if (profile === 'performance') {
    return {
      width: 640,
      height: 360,
      frameRate: 30,
    }
  }

  if (profile === 'quality') {
    return {
      width: 720,
      height: 405,
      frameRate: 60,
    }
  }

  return {
    width: 640,
    height: 360,
    frameRate: 60,
  }
}
