import type {Application} from '../types/application.ts'

type ApplicationStatus = 'pending' | 'accepted' | 'rejected'

type ImportApplication = {
    company_name: string
    description: string
    url: string
    notes: string
    applied_at: string
    status: ApplicationStatus
}

type CsvField =
    | 'company_name'
    | 'description'
    | 'url'
    | 'notes'
    | 'applied_at'
    | 'status'

/**
 * Все поддерживаемые названия колонок.
 *
 * Импорт НЕ зависит от текущего языка интерфейса.
 */
const HEADER_ALIASES: Record<CsvField, string[]> = {
    company_name: [
        // Ukrainian
        'компанія',
        'назва компанії',

        // English
        'company',
        'company name',

        // German
        'unternehmen',
        'firmenname',
    ],

    description: [
        // Ukrainian
        'посада / опис',
        'посада/опис',
        'посада',
        'опис',

        // English
        'position / description',
        'position/description',
        'position',
        'description',
        'job title',

        // German
        'position / beschreibung',
        'position/beschreibung',
        'position',
        'beschreibung',
        'jobtitel',
    ],

    url: [
        // Ukrainian
        'посилання на вакансію',
        'посилання',

        // English
        'job url',
        'job link',
        'url',
        'link',

        // German
        'job-url',
        'job url',
        'job-link',
        'link',
        'url',
    ],

    notes: [
        // Ukrainian
        'нотатки',
        'замітки',

        // English
        'notes',

        // German
        'notizen',
        'bemerkungen',
    ],

    applied_at: [
        // Ukrainian
        'дата подання',
        'дата',

        // English
        'applied on',
        'applied date',
        'date',

        // German
        'bewerbungsdatum',
        'datum',
    ],

    status: [
        // Ukrainian
        'статус',

        // English
        'status',

        // German
        'status',
    ],
}


const STATUS_ALIASES: Record<ApplicationStatus, string[]> = {
    pending: [
        // API
        'pending',

        // Ukrainian
        'на розгляді',
        'запрошення',
        'відмова',
        'в очікуванні',

        // English
        'in progress',
        'interview',
        'rejected',

        // German
        'in Bearbeitung',
        'einladung',
        'absage',
    ],

    accepted: [
        // API
        'accepted',

        // Ukrainian
        'прийнято',
        'прийнята',
        'прийнятий',

        // English
        'accepted',

        // German
        'angenommen',
        'akzeptiert',
        'zugesagt',
    ],

    rejected: [
        // API
        'rejected',

        // Ukrainian
        'відхилено',
        'відхилена',
        'відмова',

        // English
        'rejected',

        // German
        'abgelehnt',
        'abgelehnt worden',
    ],
}

const normalize = (value: string): string => {
    return value
        .replace(/^\uFEFF/, '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
}

const detectDelimiter = (text: string): string => {
    const firstLine = text
        .replace(/^\uFEFF/, '')
        .split(/\r?\n/)[0] ?? ''

    const commaCount = (firstLine.match(/,/g) ?? []).length
    const semicolonCount = (firstLine.match(/;/g) ?? []).length
    const tabCount = (firstLine.match(/\t/g) ?? []).length

    if (semicolonCount > commaCount && semicolonCount >= tabCount) {
        return ';'
    }

    if (tabCount > commaCount && tabCount > semicolonCount) {
        return '\t'
    }

    return ','
}

/**
 * CSV parser, который умеет работать с:
 *
 * "Google","Frontend Developer","https://google.com","Some notes"
 *
 * и с запятыми внутри кавычек:
 *
 * "Google","Frontend, Developer","..."
 *
 * и с переносами строк внутри quoted fields.
 */
const parseCSV = (
    text: string,
    delimiter: string,
): string[][] => {
    const rows: string[][] = []
    let row: string[] = []
    let value = ''
    let insideQuotes = false

    for (let i = 0; i < text.length; i++) {
        const char = text[i]
        const nextChar = text[i + 1]

        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                value += '"'
                i++
            } else {
                insideQuotes = !insideQuotes
            }

            continue
        }

        if (char === delimiter && !insideQuotes) {
            row.push(value)
            value = ''
            continue
        }

        if ((char === '\n' || char === '\r') && !insideQuotes) {
            if (char === '\r' && nextChar === '\n') {
                i++
            }

            row.push(value)
            value = ''

            if (row.some((cell) => cell.trim() !== '')) {
                rows.push(row)
            }

            row = []
            continue
        }

        value += char
    }

    if (value !== '' || row.length > 0) {
        row.push(value)

        if (row.some((cell) => cell.trim() !== '')) {
            rows.push(row)
        }
    }

    return rows
}

const getFieldByHeader = (
    header: string,
): CsvField | null => {
    const normalizedHeader = normalize(header)

    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
        if (
            aliases.some(
                (alias) => normalize(alias) === normalizedHeader,
            )
        ) {
            return field as CsvField
        }
    }

    return null
}

const parseStatus = (
    value: string,
    rowNumber: number,
): ApplicationStatus => {
    const normalizedValue = normalize(value)

    for (const [status, aliases] of Object.entries(STATUS_ALIASES)) {
        if (
            aliases.some(
                (alias) => normalize(alias) === normalizedValue,
            )
        ) {
            return status as ApplicationStatus
        }
    }

    throw new Error(
        `Unknown status "${value}" in CSV row ${rowNumber}.`,
    )
}

/**
 * Преобразует:
 *
 * 04.10.2026
 *
 * в:
 *
 * 2026-10-04
 *
 * Также поддерживает ISO:
 *
 * 2026-10-04
 */
const parseDate = (
    value: string,
    rowNumber: number,
): string => {
    const normalizedValue = value.trim()

    if (!normalizedValue) {
        return ''
    }

    // DD.MM.YYYY
    const europeanMatch = normalizedValue.match(
        /^(\d{2})\.(\d{2})\.(\d{4})$/,
    )

    if (europeanMatch) {
        const [, day, month, year] = europeanMatch

        const date = new Date(
            Number(year),
            Number(month) - 1,
            Number(day),
        )

        if (
            date.getFullYear() !== Number(year) ||
            date.getMonth() !== Number(month) - 1 ||
            date.getDate() !== Number(day)
        ) {
            throw new Error(
                `Invalid date "${value}" in CSV row ${rowNumber}.`,
            )
        }

        return `${year}-${month}-${day}`
    }

    // YYYY-MM-DD
    const isoMatch = normalizedValue.match(
        /^\d{4}-\d{2}-\d{2}$/,
    )

    if (isoMatch) {
        return normalizedValue
    }

    throw new Error(
        `Invalid date "${value}" in CSV row ${rowNumber}. Expected DD.MM.YYYY.`,
    )
}

export const importApplicationsFromCSV = async (
    file: File,
): Promise<ImportApplication[]> => {
    const text = await file.text()

    if (!text.trim()) {
        throw new Error('CSV file is empty.')
    }

    const delimiter = detectDelimiter(text)
    const rows = parseCSV(text, delimiter)

    if (rows.length < 2) {
        throw new Error('CSV file does not contain any applications.')
    }

    const headers = rows[0]

    const fieldIndexes = new Map<CsvField, number>()

    headers.forEach((header, index) => {
        const field = getFieldByHeader(header)

        if (field) {
            fieldIndexes.set(field, index)
        }
    })

    if (!fieldIndexes.has('company_name')) {
        throw new Error(
            'CSV column "Company / Компанія / Unternehmen" was not found.',
        )
    }

    if (!fieldIndexes.has('status')) {
        throw new Error(
            'CSV column "Status / Статус" was not found.',
        )
    }

    const getValue = (
        row: string[],
        field: CsvField,
    ): string => {
        const index = fieldIndexes.get(field)

        if (index === undefined) {
            return ''
        }

        return row[index]?.trim() ?? ''
    }

    return rows
        .slice(1)
        .map((row, index) => {
            const rowNumber = index + 2

            const companyName = getValue(
                row,
                'company_name',
            )

            if (!companyName) {
                throw new Error(
                    `Company is empty in CSV row ${rowNumber}.`,
                )
            }

            const statusValue = getValue(
                row,
                'status',
            )

            if (!statusValue) {
                throw new Error(
                    `Status is empty in CSV row ${rowNumber}.`,
                )
            }

            return {
                company_name: companyName,

                description: getValue(
                    row,
                    'description',
                ),

                url: getValue(
                    row,
                    'url',
                ),

                notes: getValue(
                    row,
                    'notes',
                ),

                applied_at: parseDate(
                    getValue(row, 'applied_at'),
                    rowNumber,
                ),

                status: parseStatus(
                    statusValue,
                    rowNumber,
                ),
            }
        })
}

export type {ImportApplication}
