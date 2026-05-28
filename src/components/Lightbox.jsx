import { useEffect, useCallback } from 'react'
import './Lightbox.css'

export default function Lightbox({ images, currentIndex, onClose, onPrev, onNext }) {
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowLeft') onPrev()
    if (e.key === 'ArrowRight') onNext()
  }, [onClose, onPrev, onNext])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'auto'
    }
  }, [handleKeyDown])

  if (!images || images.length === 0) return null

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose}>&times;</button>
      
      {images.length > 1 && (
        <>
          <button className="lightbox-prev" onClick={(e) => { e.stopPropagation(); onPrev(); }}>
            &#10094;
          </button>
          <button className="lightbox-next" onClick={(e) => { e.stopPropagation(); onNext(); }}>
            &#10095;
          </button>
        </>
      )}

      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <img src={images[currentIndex]} alt="" className="lightbox-image" />
      </div>
    </div>
  )
}
