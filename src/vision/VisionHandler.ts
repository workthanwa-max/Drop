import {
  FilesetResolver,
  HandLandmarker,
  type NormalizedLandmark,
} from '@mediapipe/tasks-vision'
import type { MutableRefObject } from 'react'
import type { VisionMode, VisionStats, WristPoint, WristSnapshot } from '../app/types'
import { clamp, lerp } from '../game/math'

const wasmRoot = '/mediapipe/wasm'
const handModelPath = '/mediapipe/models/hand_landmarker.task'
const palmCenterIndex = 9
const minimumHandSize = 0.06
const maximumHandSize = 0.5
const sideSplit = 0.5
const trackingGraceMs = 180
const relockMs = 620
const maximumTrackJump = 0.46
const confirmationFrames = 1
const predictionDamping = 0.45

type VisionHandlerOptions = {
  wristRef: MutableRefObject<WristSnapshot>
  videoElement?: HTMLVideoElement | null
  fps?: number
}

type TrackSide = 'left' | 'right'

type TrackMemory = {
  point: WristPoint
  seenAt: number
  velocityX: number
  velocityY: number
  pendingFrames: number
}

type VideoElementWithFrameCallback = HTMLVideoElement & {
  requestVideoFrameCallback?: (callback: () => void) => number
  cancelVideoFrameCallback?: (handle: number) => void
}

export class VisionHandler {
  private readonly wristRef: MutableRefObject<WristSnapshot>
  private readonly videoElement: VideoElementWithFrameCallback | null
  // frame interval (ms) used to throttle inference; adaptive at runtime
  private frameMs: number
  private minimumFrameMs: number
  private timerId = 0
  private videoFrameCallbackId = 0
  private startedAt = 0
  private lastVideoTime = -1
  private lastDetectionAt = 0
  private handLandmarker: HandLandmarker | null = null
  private mode: VisionMode = 'idle'
  private droppedFrames = 0
  private statsStartedAt = 0
  private statsFrames = 0
  private currentStats: VisionStats = {
    fps: 0,
    inferenceMs: 0,
    droppedFrames: 0,
    quality: 0,
  }
  private tracks: Record<TrackSide, TrackMemory> = {
    left: createTrack(0.38),
    right: createTrack(0.62),
  }
  private readonly maxFps: number
  private targetFps: number
  private lastAdaptiveChange = 0

  constructor({ wristRef, videoElement = null, fps = 30 }: VisionHandlerOptions) {
    this.wristRef = wristRef
    this.videoElement = videoElement
    this.maxFps = Math.max(15, fps)
    // prefer a lower default to save CPU on typical machines
    this.targetFps = Math.min(this.maxFps, 20)
    this.frameMs = 1000 / this.targetFps
    this.minimumFrameMs = Math.max(16, this.frameMs)
  }

  get activeMode() {
    return this.mode
  }

  async start() {
    if (this.timerId !== 0 || this.videoFrameCallbackId !== 0) {
      return this.mode
    }

    if (!this.videoElement) {
      this.startMock()
      return this.mode
    }

    await this.startReal()
    return this.mode
  }

  startMock() {
    if (this.timerId !== 0) {
      return
    }

    this.mode = 'mock'
    this.startedAt = performance.now()
    this.scheduleMockFrame()
  }

  stop() {
    if (this.timerId !== 0) {
      window.clearTimeout(this.timerId)
      this.timerId = 0
    }

    if (this.videoFrameCallbackId !== 0 && this.videoElement?.cancelVideoFrameCallback) {
      this.videoElement.cancelVideoFrameCallback(this.videoFrameCallbackId)
      this.videoFrameCallbackId = 0
    }
  }

  pause() {
    this.stop()
  }

  resume() {
    if (this.timerId !== 0 || this.videoFrameCallbackId !== 0 || this.mode === 'idle') {
      return
    }

    if (this.mode === 'real' && this.handLandmarker) {
      this.scheduleRealFrame()
      return
    }

    if (this.mode === 'mock') {
      this.scheduleMockFrame()
    }
  }

  dispose() {
    this.stop()
    this.handLandmarker?.close()
    this.handLandmarker = null
    this.mode = 'idle'
    this.tracks = {
      left: createTrack(0.38),
      right: createTrack(0.62),
    }
    this.currentStats = {
      fps: 0,
      inferenceMs: 0,
      droppedFrames: 0,
      quality: 0,
    }
    this.wristRef.current = createHiddenSnapshot(this.currentStats)
  }

  private async startReal() {
    if (!this.videoElement) {
      throw new Error('ต้องมี video element สำหรับโหมดกล้องจริง')
    }

    this.handLandmarker = await createHandLandmarker()
    this.mode = 'real'
    this.lastVideoTime = -1
    this.lastDetectionAt = 0
    this.droppedFrames = 0
    this.statsStartedAt = performance.now()
    this.statsFrames = 0
    this.scheduleRealFrame()
  }

  private readonly scheduleRealFrame = () => {
    if (this.videoElement?.requestVideoFrameCallback) {
      this.videoFrameCallbackId = this.videoElement.requestVideoFrameCallback(() => {
        this.videoFrameCallbackId = 0
        this.detectVideoFrame()
        if (this.mode === 'real' && this.handLandmarker) {
          this.scheduleRealFrame()
        }
      })
      return
    }

    this.timerId = window.setTimeout(() => {
      this.timerId = 0
      this.detectVideoFrame()
      if (this.mode === 'real' && this.handLandmarker) {
        this.scheduleRealFrame()
      }
    }, this.frameMs)
  }

  private readonly scheduleMockFrame = () => {
    this.timerId = window.setTimeout(() => {
      this.timerId = 0
      this.writeMockHandSnapshot(performance.now())
      if (this.mode === 'mock') {
        this.scheduleMockFrame()
      }
    }, this.frameMs)
  }

  private detectVideoFrame() {
    if (!this.videoElement || !this.handLandmarker) {
      return
    }

    if (this.videoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return
    }

    if (this.videoElement.currentTime === this.lastVideoTime) {
      return
    }

    const now = performance.now()

    if (now - this.lastDetectionAt < this.minimumFrameMs) {
      this.droppedFrames += 1
      return
    }

    this.lastVideoTime = this.videoElement.currentTime
    this.lastDetectionAt = now

    const inferenceStartedAt = performance.now()
    const result = this.handLandmarker.detectForVideo(this.videoElement, now)
    const inferenceMs = performance.now() - inferenceStartedAt
    // adaptive throttling: if inference takes too long, reduce target FPS
    if (inferenceMs > 40 && now - this.lastAdaptiveChange > 500) {
      // lower target fps to save CPU
      this.targetFps = Math.max(10, Math.floor(this.targetFps * 0.8))
      this.frameMs = 1000 / this.targetFps
      this.minimumFrameMs = Math.max(16, this.frameMs)
      this.lastAdaptiveChange = now
    } else if (inferenceMs < 20 && this.targetFps < this.maxFps && now - this.lastAdaptiveChange > 800) {
      // try to increase fps back up slowly
      this.targetFps = Math.min(this.maxFps, Math.ceil(this.targetFps * 1.12))
      this.frameMs = 1000 / this.targetFps
      this.minimumFrameMs = Math.max(16, this.frameMs)
      this.lastAdaptiveChange = now
    }
    const candidates = result.landmarks.map(createHandPoint).filter((point) => point.visible)
    const { left, right } = this.assignPlayerHands(candidates, now)
    const quality = getTrackingQuality(left, right)

    this.updateStats(now, inferenceMs, quality)
    this.wristRef.current = {
      left,
      right,
      tracking: left.active || right.active,
      timestamp: now,
      stats: this.currentStats,
    }
  }

  private assignPlayerHands(candidates: WristPoint[], now: number) {
    let leftCandidate = pickBestCandidate(
      candidates,
      'left',
      this.tracks.left.point,
      now - this.tracks.left.seenAt,
    )
    let rightCandidate = pickBestCandidate(
      candidates,
      'right',
      this.tracks.right.point,
      now - this.tracks.right.seenAt,
    )

    if (leftCandidate && rightCandidate && leftCandidate === rightCandidate) {
      const leftScore = scoreCandidate(
        leftCandidate,
        'left',
        this.tracks.left.point,
        now - this.tracks.left.seenAt,
      )
      const rightScore = scoreCandidate(
        rightCandidate,
        'right',
        this.tracks.right.point,
        now - this.tracks.right.seenAt,
      )

      if (leftScore > rightScore) {
        rightCandidate = null
      } else if (rightScore > leftScore) {
        leftCandidate = null
      } else {
        if (leftCandidate.x < sideSplit) {
          rightCandidate = null
        } else {
          leftCandidate = null
        }
      }
    }

    const left = this.stabilizeTrack('left', leftCandidate, now, 0.38)
    const right = this.stabilizeTrack('right', rightCandidate, now, 0.62)

    return { left, right }
  }

  private stabilizeTrack(
    side: TrackSide,
    candidate: WristPoint | null,
    now: number,
    fallbackX: number,
  ) {
    const track = this.tracks[side]
    const previous = track.point
    const timeSinceSeen = now - track.seenAt

    if (!candidate) {
      track.pendingFrames = 0

      if (previous.active && timeSinceSeen < trackingGraceMs) {
        return predictPoint(previous, track, timeSinceSeen)
      }

      const hidden = createHiddenPoint(fallbackX)

      track.point = hidden
      track.velocityX = 0
      track.velocityY = 0
      return hidden
    }

    const distance = previous.active ? getDistance(previous, candidate) : 0
    const canRelock = !previous.active || timeSinceSeen > relockMs

    if (!canRelock && distance > maximumTrackJump) {
      track.pendingFrames = 0
      return predictPoint(previous, track, timeSinceSeen)
    }

    if (!previous.active) {
      track.pendingFrames += 1

      if (track.pendingFrames < confirmationFrames) {
        return createHiddenPoint(fallbackX)
      }
    }

    const deltaSeconds = Math.max((now - track.seenAt) / 1000, 1 / 60)
    const targetVelocityX = previous.active ? (candidate.x - previous.x) / deltaSeconds : 0
    const targetVelocityY = previous.active ? (candidate.y - previous.y) / deltaSeconds : 0
    const velocityBlend = previous.active ? 0.45 : 1
    const smoothing = getAdaptiveSmoothing(distance, candidate.confidence)
    const stable = previous.active
      ? {
          ...candidate,
          x: lerp(previous.x, candidate.x, smoothing),
          y: lerp(previous.y, candidate.y, smoothing),
          size: lerp(previous.size, candidate.size, smoothing),
        }
      : candidate

    track.velocityX = lerp(track.velocityX, targetVelocityX, velocityBlend)
    track.velocityY = lerp(track.velocityY, targetVelocityY, velocityBlend)
    track.point = stable
    track.seenAt = now
    track.pendingFrames = confirmationFrames

    return stable
  }

  private updateStats(now: number, inferenceMs: number, quality: number) {
    this.statsFrames += 1

    const sampleMs = now - this.statsStartedAt
    const fps =
      sampleMs >= 500 ? Math.round((this.statsFrames * 1000) / sampleMs) : this.currentStats.fps

    this.currentStats = {
      fps,
      inferenceMs: Math.round(inferenceMs),
      droppedFrames: this.droppedFrames,
      quality,
    }

    if (sampleMs >= 500) {
      this.statsStartedAt = now
      this.statsFrames = 0
      this.droppedFrames = 0
    }

    this.adaptFrameRate(now, inferenceMs)
  }

  private adaptFrameRate(now: number, inferenceMs: number) {
    if (inferenceMs > this.frameMs) {
      this.targetFps = Math.max(this.maxFps * 0.5, 15)
    } else {
      this.targetFps = this.maxFps
    }

    const adaptiveFrameMs = 1000 / this.targetFps

    if (now - this.lastAdaptiveChange > 500) {
      this.frameMs = lerp(this.frameMs, adaptiveFrameMs, 0.1)
      this.minimumFrameMs = Math.max(16, this.frameMs)
      this.lastAdaptiveChange = now
    }
  }

  private writeMockHandSnapshot(now: number) {
    const seconds = (now - this.startedAt) / 1000
    const sway = Math.sin(seconds * 1.5)
    const rightReach = Math.max(0, Math.sin(seconds * 0.8))
    const stats = {
      fps: Math.round(1000 / this.frameMs),
      inferenceMs: 1,
      droppedFrames: 0,
      quality: 1,
    }

    this.wristRef.current = {
      left: {
        x: 0.32 + sway * 0.08,
        y: 0.58 + Math.cos(seconds * 2) * 0.08,
        confidence: 0.96,
        visible: true,
        active: true,
        size: 0.2,
      },
      right: {
        x: 0.58 + rightReach * 0.3,
        y: 0.54 - rightReach * 0.42,
        confidence: 0.96,
        visible: true,
        active: true,
        size: 0.2,
      },
      tracking: true,
      timestamp: now,
      stats,
    }
  }
}

async function createHandLandmarker() {
  const visionFileset = await FilesetResolver.forVisionTasks(wasmRoot)

  return HandLandmarker.createFromOptions(visionFileset, {
    baseOptions: {
      modelAssetPath: handModelPath,
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numHands: 2,
    minHandDetectionConfidence: 0.60,
    minHandPresenceConfidence: 0.60,
    minTrackingConfidence: 0.60,
  })
}

function createHandPoint(landmarks: NormalizedLandmark[]): WristPoint {
  const center = landmarks[palmCenterIndex] ?? averageLandmarks(landmarks)
  const bounds = getBounds(landmarks)
  const size = Math.max(bounds.width, bounds.height)
  const confidence = clamp((size - minimumHandSize) / 0.16, 0, 1)
  const x = mirrorX(center.x)
  const y = center.y
  const visible =
    size >= minimumHandSize &&
    size <= maximumHandSize &&
    x >= 0.03 &&
    x <= 0.97 &&
    y >= 0.08 &&
    y <= 0.96

  return {
    x,
    y,
    confidence,
    visible,
    active: visible,
    size,
    landmarks: landmarks.map(l => ({ x: mirrorX(l.x), y: l.y })),
  }
}

function pickBestCandidate(
  candidates: WristPoint[],
  side: TrackSide,
  previous: WristPoint,
  timeSinceSeen: number,
): WristPoint | null {
  let best: WristPoint | null = null
  let bestScore = -1

  candidates.forEach((candidate) => {
    if (side === 'left' && candidate.x > 0.58) {
      return
    }

    if (side === 'right' && candidate.x < 0.42) {
      return
    }

    const score = scoreCandidate(candidate, side, previous, timeSinceSeen)

    if (score > bestScore) {
      best = candidate
      bestScore = score
    }
  })

  return best
}

function scoreCandidate(
  candidate: WristPoint,
  side: TrackSide,
  previous: WristPoint,
  timeSinceSeen: number,
) {
  const sideFit =
    side === 'left'
      ? clamp((sideSplit + 0.2 - candidate.x) / 0.5, 0, 1)
      : clamp((candidate.x - sideSplit + 0.2) / 0.5, 0, 1)
  const sizeScore = clamp(candidate.size / 0.2, 0, 1)
  const centerScore = 1 - clamp(Math.abs(candidate.y - 0.58) / 0.52, 0, 1)
  const continuity =
    previous.active && timeSinceSeen < relockMs
      ? 1 - clamp(getDistance(previous, candidate) / maximumTrackJump, 0, 1)
      : 0.35

  return sideFit * 0.26 + sizeScore * 0.24 + centerScore * 0.12 + continuity * 0.38
}

function getAdaptiveSmoothing(distance: number, confidence: number) {
  if (distance > 0.18) {
    return 0.85
  }

  if (distance > 0.08) {
    return 0.75
  }

  return lerp(0.48, 0.62, confidence)
}

function predictPoint(point: WristPoint, track: TrackMemory, timeSinceSeenMs: number) {
  const seconds = Math.min(timeSinceSeenMs / 1000, trackingGraceMs / 1000)

  return {
    ...point,
    x: clamp(point.x + track.velocityX * seconds * predictionDamping, 0, 1),
    y: clamp(point.y + track.velocityY * seconds * predictionDamping, 0, 1),
  }
}

function getTrackingQuality(left: WristPoint, right: WristPoint) {
  const activeHands = Number(left.active) + Number(right.active)
  const confidence = (left.confidence + right.confidence) / 2

  return Math.round((activeHands / 2) * confidence * 100) / 100
}

function getDistance(first: WristPoint, second: WristPoint) {
  const dx = first.x - second.x
  const dy = first.y - second.y

  return Math.sqrt(dx * dx + dy * dy)
}

function getBounds(landmarks: NormalizedLandmark[]) {
  return landmarks.reduce(
    (bounds, landmark) => ({
      minX: Math.min(bounds.minX, landmark.x),
      maxX: Math.max(bounds.maxX, landmark.x),
      minY: Math.min(bounds.minY, landmark.y),
      maxY: Math.max(bounds.maxY, landmark.y),
      width: Math.max(bounds.maxX, landmark.x) - Math.min(bounds.minX, landmark.x),
      height: Math.max(bounds.maxY, landmark.y) - Math.min(bounds.minY, landmark.y),
    }),
    {
      minX: 1,
      maxX: 0,
      minY: 1,
      maxY: 0,
      width: 0,
      height: 0,
    },
  )
}

function averageLandmarks(landmarks: NormalizedLandmark[]) {
  const total = landmarks.reduce(
    (sum, landmark) => ({
      x: sum.x + landmark.x,
      y: sum.y + landmark.y,
      z: sum.z + landmark.z,
      visibility: sum.visibility + landmark.visibility,
    }),
    { x: 0, y: 0, z: 0, visibility: 0 },
  )
  const count = Math.max(landmarks.length, 1)

  return {
    x: total.x / count,
    y: total.y / count,
    z: total.z / count,
    visibility: total.visibility / count,
  }
}

function createTrack(x: number): TrackMemory {
  return {
    point: createHiddenPoint(x),
    seenAt: 0,
    velocityX: 0,
    velocityY: 0,
    pendingFrames: 0,
  }
}

function createHiddenSnapshot(stats: VisionStats): WristSnapshot {
  return {
    left: createHiddenPoint(0.38),
    right: createHiddenPoint(0.62),
    tracking: false,
    timestamp: performance.now(),
    stats,
  }
}

function createHiddenPoint(x: number): WristPoint {
  return {
    x,
    y: 0.5,
    confidence: 0,
    visible: false,
    active: false,
    size: 0,
  }
}

function mirrorX(value: number) {
  return 1 - value
}
