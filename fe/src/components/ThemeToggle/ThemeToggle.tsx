import {useTranslation} from 'react-i18next'
import {useTheme} from '../../hooks/useTheme.ts'
import styles from './ThemeToggle.module.scss'

function ThemeToggle() {
    const {t} = useTranslation()
    const {theme, toggleTheme} = useTheme()

    const label =
        theme === 'dark' ? t('theme.switchToLight') : t('theme.switchToDark')

    return (
        <button
            type="button"
            className={styles.toggle}
            onClick={toggleTheme}
            aria-label={label}
            title={label}
        >
            {theme === 'dark' ? '☀️' : '🌙'}
        </button>
    )
}

export default ThemeToggle