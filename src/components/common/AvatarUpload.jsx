import { useRef, useState } from 'react'
import Avatar from './Avatar.jsx'
import Button from './Button.jsx'
import { readImageAsAvatar } from '../../utils/imageUpload.js'

/**
 * Avatar with an inline "change photo" control.
 * Accepts an image file, downscales/crops it client-side and hands the
 * resulting data URL to `onChange` for the caller to persist.
 */
export default function AvatarUpload({ value, name = '', size = 'lg', onChange }) {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = // allow re-selecting the same file
      ''
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const dataUrl = await readImageAsAvatar(file)
      onChange?.(dataUrl)
    } catch (err) {
      setError(err.message || 'Could not process that image.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="avatar-upload text-center">
      <div className="avatar-upload-frame mx-auto">
        <Avatar src={value} name={name} size={size} />
        <button
          type="button"
          className="avatar-upload-edit"
          onClick={() => inputRef.current?.click()}
          aria-label="Change profile photo"
        >
          <CameraGlyph />
        </button>
      </div>

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleFile} />

      <div className="row" style={{ justifyContent: 'center', gap: 8, marginTop: 12 }}>
        <Button size="sm" variant="secondary" icon="camera" loading={busy} onClick={() => inputRef.current?.click()}>
          Change photo
        </Button>
        {value && (
          <Button size="sm" variant="ghost" icon="x" onClick={() => onChange?.(null)}>
            Remove
          </Button>
        )}
      </div>
      {error && <span className="field-error block mt-1">{error}</span>}
      <p className="text-xs text-muted mt-1 mb-0">JPG, PNG or WebP — a square crop is applied automatically.</p>
    </div>
  )
}

function CameraGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <path
        d="M4 8h2.3c.5 0 .9-.2 1.2-.6l1-1.3c.3-.4.7-.6 1.2-.6h4.6c.5 0 .9.2 1.2.6l1 1.3c.3.4.7.6 1.2.6H20c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2v-8c0-1.1.9-2 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="14" r="3.4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}
