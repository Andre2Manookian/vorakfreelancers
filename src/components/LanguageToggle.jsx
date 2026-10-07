import { useLanguage } from '../contexts/LanguageContext'
import styles from './LanguageToggle.module.css'

const LANGS = [
  { code: 'am', label: 'AM' },
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
]

export default function LanguageToggle({ className = '', compact = false }) {
  const { lang, setLang } = useLanguage()
  const rootClassName = [styles.toggle, compact ? styles.compact : '', className].filter(Boolean).join(' ')

  return (
    <div className={rootClassName} role="group" aria-label="Language">
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          className={`${styles.btn} ${compact ? styles.compactBtn : ''} ${lang === code ? styles.active : ''}`}
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
