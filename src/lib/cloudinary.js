const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = 'vorak_uploads'
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`

const MAX_FILE_SIZE = 20 * 1024 * 1024
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export async function uploadFile(file, folder = 'general') {
  if (!file) throw new Error('No file provided')
  if (file.size > MAX_FILE_SIZE) throw new Error('File size must be under 20MB')
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('File type not allowed. Use JPG, PNG, GIF, WEBP, PDF, or DOC.')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', `${CLOUD_NAME}/${folder}`)

  const response = await fetch(UPLOAD_URL, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || 'Upload failed')
  }

  const data = await response.json()

  if (data.moderation?.[0]?.status === 'rejected') {
    throw new Error('This image violates our content policy')
  }

  return {
    url: data.secure_url,
    publicId: data.public_id,
    format: data.format,
    bytes: data.bytes,
    width: data.width,
    height: data.height,
  }
}

export function isImageFile(file) {
  return file?.type?.startsWith('image/')
}
