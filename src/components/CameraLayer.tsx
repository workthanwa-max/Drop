import { useEffect, type RefObject } from 'react'
import { attachStreamToVideo } from '../vision/camera'

type CameraLayerProps = {
  stream: MediaStream | null
  isMockMode: boolean
  videoRef: RefObject<HTMLVideoElement | null>
  onVideoReady: (videoElement: HTMLVideoElement) => void
  onVideoError: () => void
}

export function CameraLayer({
  stream,
  isMockMode,
  videoRef,
  onVideoReady,
  onVideoError,
}: CameraLayerProps) {
  useEffect(() => {
    if (!stream || !videoRef.current) {
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }

      return
    }

    const videoElement = videoRef.current
    void attachStreamToVideo(videoElement, stream)
      .then(() => onVideoReady(videoElement))
      .catch(onVideoError)
  }, [onVideoError, onVideoReady, stream, videoRef])

  return (
    <div className="camera-layer" aria-hidden="true">
      <video ref={videoRef} muted playsInline className="camera-video" />
      {isMockMode ? <div className="mock-camera-feed" /> : null}
    </div>
  )
}
