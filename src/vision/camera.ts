import { getCameraProfile } from '../app/performance'
import type { QualityProfile } from '../app/types'

export async function requestCameraStream(profile: QualityProfile) {
  const camera = getCameraProfile(profile)

  return navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: 'user',
      width: { ideal: camera.width },
      height: { ideal: camera.height },
      frameRate: { ideal: camera.frameRate, max: camera.frameRate },
    },
    audio: false,
  })
}

export function attachStreamToVideo(
  videoElement: HTMLVideoElement,
  stream: MediaStream,
) {
  videoElement.srcObject = stream
  return new Promise<void>((resolve, reject) => {
    const handleReady = () => {
      videoElement.play().then(resolve).catch(reject)
    }

    if (videoElement.readyState >= HTMLMediaElement.HAVE_METADATA) {
      handleReady()
      return
    }

    videoElement.addEventListener('loadedmetadata', handleReady, { once: true })
    videoElement.addEventListener('error', () => reject(videoElement.error), {
      once: true,
    })
  })
}

export function stopCameraStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop())
}
