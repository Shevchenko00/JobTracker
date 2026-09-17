import i18n from 'i18next'
import {initReactI18next} from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import de from './locales/de.json'
import en from './locales/en.json'
import uk from './locales/uk.json'

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            de: {translation: de},
            en: {translation: en},
            uk: {translation: uk},
        },
        fallbackLng: 'de',
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['querystring', 'cookie', 'localStorage'],
            caches: ['cookie', 'localStorage'],
            lookupCookie: 'language',        // <-- Теперь кука называются 'language'
            lookupLocalStorage: 'language',  // <-- Теперь localStorage ключ называется 'language'
        },
    })

export default i18n