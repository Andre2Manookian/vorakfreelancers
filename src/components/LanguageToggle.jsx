import { useLanguage } from '../contexts/LanguageContext'
import styles from './LanguageToggle.module.css'

const LANGS = [
  { code: 'am', label: 'AM' },
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
]

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage()

  return (
    <div className={styles.toggle} role="group" aria-label="Language">
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          className={`${styles.btn} ${lang === code ? styles.active : ''}`}
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
