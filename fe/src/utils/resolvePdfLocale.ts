const PDF_LOCALE_MAP: Record<string, string> = {
    de: 'de-DE',
    en: 'en-US',
    uk: 'uk-UA',
}

const FALLBACK_LOCALE = 'de-DE'

export function resolvePdfLocale(language: string): string {
    // "en-US" -> "en", falls i18n.language bereits eine Region enthält
    const baseLanguage = language.split('-')[0]

    return PDF_LOCALE_MAP[baseLanguage] ?? FALLBACK_LOCALE
}