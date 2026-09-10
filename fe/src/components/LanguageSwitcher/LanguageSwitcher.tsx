import {useTranslation} from 'react-i18next'
import styles from './LanguageSwitcher.module.scss'

const LANGUAGES = [
    {code: 'de', label: 'DE'},
    {code: 'en', label: 'EN'},
    {code: 'uk', label: 'UA'},
]

function LanguageSwitcher() {
    const {i18n} = useTranslation()

    return (
        <div className={styles.switcher}>
            {LANGUAGES.map(({code, label}) => (
                <button
                    key={code}
                    type="button"
                    className={
                        i18n.language === code ? styles.active : ''
                    }
                    onClick={() => i18n.changeLanguage(code)}
                >
                    {label}
                </button>
            ))}
        </div>
    )
}

export default LanguageSwitcher