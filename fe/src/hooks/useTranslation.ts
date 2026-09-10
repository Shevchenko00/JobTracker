import {useTranslation} from 'react-i18next'

function App() {
    const {t} = useTranslation()

    return (
        <h1>{t('app.title')}</h1>
    )
}