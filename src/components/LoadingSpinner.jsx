import styles from './LoadingSpinner.module.css'

export default function LoadingSpinner({ size = 'medium' }) {
  return (
    <div className={`${styles.spinner} ${styles[size]}`} role="status" aria-label="Loading">
      <div className={styles.ring} />
    </div>
  )
}
