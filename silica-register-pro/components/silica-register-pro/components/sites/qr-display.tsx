'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

export default function QRDisplay({ url, siteName }: { url: string; siteName: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 200,
        margin: 2,
        color: { dark: '#111827', light: '#ffffff' },
      })
    }
  }, [url])

  async function handleDownload() {
    const dataUrl = await QRCode.toDataURL(url, {
      width: 600,
      margin: 3,
      color: { dark: '#111827', light: '#ffffff' },
    })
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `qr-${siteName.toLowerCase().replace(/\s+/g, '-')}.png`
    a.click()
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas ref={canvasRef} className="rounded-lg" />
      <button
        onClick={handleDownload}
        className="text-xs text-green-600 hover:text-green-700 font-medium underline hover:no-underline"
      >
        Download QR PNG
      </button>
    </div>
  )
}
