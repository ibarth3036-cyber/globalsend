import { useState, useCallback, useRef } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { FiUploadCloud, FiCamera, FiX, FiZoomIn, FiZoomOut } from 'react-icons/fi'

interface ImageUploadProps {
  onFile: (file: File) => void
  accept?: string
  label?: string
  crop?: boolean
  aspect?: number
  currentUrl?: string
  cropShape?: 'rect' | 'round'
}

export function ImageUpload({
  onFile,
  accept = 'image/*',
  label = 'Upload Image',
  crop = false,
  aspect = 1,
  currentUrl,
  cropShape = 'rect',
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState('')
  const [showCrop, setShowCrop] = useState(false)

  const [imageSrc, setImageSrc] = useState('')
  const [cropState, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return
    setFileName(file.name)
    setFileSize(file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`
    )
    const reader = new FileReader()
    reader.onload = () => {
      const src = reader.result as string
      setPreview(src)
      if (crop) {
        setImageSrc(src)
        setShowCrop(true)
      } else {
        onFile(file)
      }
    }
    reader.readAsDataURL(file)
  }

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  async function applyCrop() {
    if (!imageSrc || !croppedAreaPixels) return
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    canvas.width = croppedAreaPixels.width
    canvas.height = croppedAreaPixels.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(
      image, croppedAreaPixels.x, croppedAreaPixels.y,
      croppedAreaPixels.width, croppedAreaPixels.height,
      0, 0, croppedAreaPixels.width, croppedAreaPixels.height
    )
    canvas.toBlob(blob => {
      if (blob) {
        const file = new File([blob], fileName || 'cropped.jpg', { type: 'image/jpeg' })
        onFile(file)
        setShowCrop(false)
      }
    }, 'image/jpeg', 0.9)
  }

  function clear() {
    setPreview(null)
    setFileName('')
    setFileSize('')
    setShowCrop(false)
    if (inputRef.current) inputRef.current.value = ''
    if (cameraRef.current) cameraRef.current.value = ''
  }

  return (
    <div className="image-upload">
      <label className="image-upload-label">{label}</label>

      {preview && !showCrop ? (
        <div className="image-upload-preview">
          <img src={preview} alt="Preview" />
          <div className="image-upload-overlay">
            <div className="image-upload-info">
              <span>{fileName}</span>
              <span>{fileSize}</span>
            </div>
            <div className="image-upload-actions">
              <button type="button" className="image-upload-btn" onClick={() => inputRef.current?.click()}>
                <FiUploadCloud size={16} /> Change
              </button>
              <button type="button" className="image-upload-btn danger" onClick={clear}>
                <FiX size={16} /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : currentUrl && !preview ? (
        <div className="image-upload-preview existing">
          <img src={currentUrl} alt="Current" />
          <div className="image-upload-overlay">
            <button type="button" className="image-upload-btn" onClick={() => inputRef.current?.click()}>
              <FiUploadCloud size={16} /> Change
            </button>
          </div>
        </div>
      ) : (
        <div className="image-upload-zone" onClick={() => inputRef.current?.click()}>
          <FiUploadCloud size={36} />
          <span className="image-upload-zone-text">Click to upload</span>
          <span className="image-upload-zone-hint">or drag & drop — {accept.replace('image/*', 'Images (PNG, JPG)')}</span>
        </div>
      )}

      <div className="image-upload-buttons">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          hidden
        />
        <button type="button" className="image-upload-camera" onClick={() => cameraRef.current?.click()} title="Take photo">
          <FiCamera size={18} />
        </button>
        <input
          ref={cameraRef}
          type="file"
          accept={accept}
          capture="environment"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          hidden
        />
      </div>

      {showCrop && (
        <div className="crop-modal-overlay" onClick={() => setShowCrop(false)}>
          <div className="crop-modal" onClick={e => e.stopPropagation()}>
            <div className="crop-modal-header">
              <h3>Crop Image</h3>
              <button type="button" className="crop-close" onClick={() => setShowCrop(false)}><FiX size={20} /></button>
            </div>
            <div className="crop-container">
              <Cropper
                image={imageSrc}
                crop={cropState}
                zoom={zoom}
                aspect={aspect}
                cropShape={cropShape}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="crop-controls">
              <button type="button" className="crop-zoom-btn" onClick={() => setZoom(z => Math.max(1, z - 0.1))}>
                <FiZoomOut size={18} />
              </button>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={e => setZoom(Number(e.target.value))}
                className="crop-slider"
              />
              <button type="button" className="crop-zoom-btn" onClick={() => setZoom(z => Math.min(3, z + 0.1))}>
                <FiZoomIn size={18} />
              </button>
            </div>
            <div className="crop-actions">
              <button type="button" className="btn btn-outline" onClick={() => setShowCrop(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={applyCrop}>Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}
