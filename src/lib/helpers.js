export const COMMISSION_RATE = 0.08

export function safeNumber(val) { 
  return isNaN(val) || val === null || val === undefined ? 0 : Number(val) 
}

export const CATEGORIES = [
  { slug: 'web-development', name: 'Web Development', emoji: '💻', key: 'webDevelopment' },
  { slug: 'mobile-apps', name: 'Mobile Apps', emoji: '📱', key: 'mobileApps' },
  { slug: 'graphic-design', name: 'Graphic Design', emoji: '🎨', key: 'graphicDesign' },
  { slug: 'video-editing', name: 'Video Editing', emoji: '🎬', key: 'videoEditing' },
  { slug: 'digital-marketing', name: 'Digital Marketing', emoji: '📣', key: 'digitalMarketing' },
  { slug: 'translation', name: 'Translation', emoji: '🌐', key: 'translation' },
  { slug: 'accounting', name: 'Accounting', emoji: '💼', key: 'accounting' },
  { slug: 'content-writing', name: 'Content Writing', emoji: '✍️', key: 'contentWriting' },
]

export const LANGUAGES_FILTER = ['Armenian', 'Russian', 'English', 'Georgian']

export function calculateCommission(amount) {
  const num = Number(amount) || 0
  const commission = num * COMMISSION_RATE
  const talentPayout = num - commission
  return {
    amount: num,
    commissionAmount: Math.round(commission * 100) / 100,
    talentPayout: Math.round(talentPayout * 100) / 100,
  }
}

export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(Number(amount) || 0)
}

export function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatRelativeTime(date) {
  if (!date) return ''
  const now = new Date()
  const then = new Date(date)
  const diff = Math.floor((now - then) / 1000)

  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return formatDate(date)
}

export function isUserOnline(lastSeen) {
  if (!lastSeen) return false
  const diff = Date.now() - new Date(lastSeen).getTime()
  return diff < 2 * 60 * 1000
}

export function truncate(str, length = 100) {
  if (!str) return ''
  if (str.length <= length) return str
  return `${str.slice(0, length)}...`
}

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function getCategoryBySlug(slug) {
  return CATEGORIES.find((c) => c.slug === slug)
}

export function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

export const CONTRACT_STATUS_COLORS = {
  pending_payment: 'amber',
  awaiting_confirmation: 'yellow',
  active: 'teal',
  work_submitted: 'blue',
  completed: 'green',
  disputed: 'red',
  cancelled: 'gray',
  refunded: 'gray',
}

export const BANNED_WORDS_DEFAULT = [
  'spam',
  'scam',
]

export function containsBannedWord(text, bannedWords = BANNED_WORDS_DEFAULT) {
  if (!text) return false
  const lower = text.toLowerCase()
  return bannedWords.some((word) => lower.includes(word.toLowerCase()))
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
