'use client'

import { useEffect, useRef } from 'react'

interface VoiceWaveformProps {
  audioLevel: number // 0-100
  isListening: boolean
  isSpeaking: boolean
  isProcessing: boolean
  className?: string
}

export default function VoiceWaveform({
  audioLevel,
  isListening,
  isSpeaking,
  isProcessing,
  className = ''
}: VoiceWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const barsRef = useRef<number[]>([])
  const targetBarsRef = useRef<number[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize bars
  useEffect(() => {
    const barCount = 20
    barsRef.current = Array(barCount).fill(0)
    targetBarsRef.current = Array(barCount).fill(0)
  }, [])

  // Handle canvas sizing for responsiveness and retina displays
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1
      const isMobile = window.innerWidth < 768

      // Responsive sizing: smaller on mobile
      const width = isMobile ? 80 : 100
      const height = isMobile ? 32 : 40

      // Set display size (CSS pixels)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      // Set actual canvas size (scaled for retina)
      canvas.width = width * dpr
      canvas.height = height * dpr

      // Scale context for retina
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(dpr, dpr)
      }
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)

    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [])

  // Animate waveform
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const barCount = 20
    const barWidth = 3
    const barGap = 2

    const animate = () => {
      // Get current canvas display dimensions
      const displayWidth = parseInt(canvas.style.width) || 100
      const displayHeight = parseInt(canvas.style.height) || 40
      const maxBarHeight = displayHeight

      // Clear canvas (use actual canvas dimensions for clearing)
      ctx.clearRect(0, 0, displayWidth, displayHeight)

      // Update target bars based on audio level and state
      if (isListening && isSpeaking) {
        // Active speaking - animate based on real audio level
        for (let i = 0; i < barCount; i++) {
          // Create wave pattern with audio level influence
          const wave = Math.sin((Date.now() / 200) + (i * 0.5))
          const randomness = Math.random() * 0.3
          const levelInfluence = (audioLevel / 100) * 0.7
          targetBarsRef.current[i] = (wave * 0.5 + 0.5) * levelInfluence + randomness
        }
      } else if (isListening && !isSpeaking) {
        // Listening but no speech - gentle idle animation
        for (let i = 0; i < barCount; i++) {
          const wave = Math.sin((Date.now() / 1000) + (i * 0.3))
          targetBarsRef.current[i] = (wave * 0.5 + 0.5) * 0.15 // 15% height
        }
      } else if (isProcessing) {
        // Processing - pulsing animation
        for (let i = 0; i < barCount; i++) {
          const pulse = Math.sin((Date.now() / 300) + (i * 0.2))
          targetBarsRef.current[i] = (pulse * 0.5 + 0.5) * 0.5
        }
      } else {
        // Idle - minimal animation
        for (let i = 0; i < barCount; i++) {
          targetBarsRef.current[i] = 0.05
        }
      }

      // Smooth transition to target values
      for (let i = 0; i < barCount; i++) {
        const diff = targetBarsRef.current[i] - barsRef.current[i]
        barsRef.current[i] += diff * 0.2 // Smooth interpolation
      }

      // Draw bars
      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + barGap)
        const height = barsRef.current[i] * maxBarHeight
        const y = (maxBarHeight - height) / 2

        // Color gradient based on state
        let color = 'rgba(16, 185, 129, 0.6)' // Default: accent-primary
        if (isSpeaking) {
          color = 'rgba(16, 185, 129, 1)' // Bright green when speaking
        } else if (isProcessing) {
          color = 'rgba(96, 165, 250, 0.8)' // Blue when processing
        } else if (isListening) {
          color = 'rgba(16, 185, 129, 0.4)' // Dim green when listening
        } else {
          color = 'rgba(156, 163, 175, 0.3)' // Gray when idle
        }

        ctx.fillStyle = color
        ctx.fillRect(x, y, barWidth, height)
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [audioLevel, isListening, isSpeaking, isProcessing])

  return (
    <div ref={containerRef} className={className} style={{ display: 'inline-block' }}>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          imageRendering: 'crisp-edges'
        }}
      />
    </div>
  )
}
