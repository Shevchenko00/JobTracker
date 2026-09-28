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

const REQUIRED_FIELDS: CsvField[] = ['company_name', 'status']

/**
 * Поддерживаемые названия колонок.
 * Импорт НЕ зависит от текущего языка интерфейса — распознаёт
 * DE / UK / EN одновременно.
 */
const HEADER_ALIASES: Record<CsvField, string[]> = {
    company_name: ['компанія', 'company', 'unternehmen'],
    description: [
        'посада / опис',
        'position / description',
        'position / beschreibung',
    ],
    url: ['посилання на вакансію', 'job url'],
    notes: ['нотатки', 'notes', 'notizen'],
    applied_at: ['дата подання', 'applied on', 'bewerbungsdatum'],
    status: ['статус', 'status'],
}

/**
 * ВАЖНО: одно и то же слово не должно встречаться в двух статусах —
 * проверка идёт по порядку (pending → accepted → rejected), совпадение
 * "перехватывается" первым же списком, в котором найдено.
 */
const STATUS_ALIASES: Record<ApplicationStatus, string[]> = {
    pending: [
        'pending', 'на розгляді', 'в очікуванні', 'запрошення',
        'in progress', 'interview', 'in bearbeitung', 'einladung',
    ],
    accepted: [
        'accepted', 'прийнято', 'прийнята', 'прийнятий',
        'angenommen', 'akzeptiert', 'zugesagt',
    ],
    rejected: [
        'rejected', 'відхилено', 'відхилена', 'відмова',
        'abgelehnt', 'absage',
    ],
}

const normalize = (value: string): string =>
    value.replace(/^\uFEFF/, '').trim().toLowerCase().replace(/\s+/g, ' ')

const detectDelimiter = (text: string): string => {
    const firstLine = text.replace(/^\uFEFF/, '').split(/\r?\n/)[0] ?? ''
    const commaCount = (firstLine.match(/,/g) ?? []).length
    const semicolonCount = (firstLine.match(/;/g) ?? []).length
    const tabCount = (firstLine.match(/\t/g) ?? []).length

    if (semicolonCount > commaCount && semicolonCount >= tabCount) return ';'
    if (tabCount > commaCount && tabCount > semicolonCount) return '\t'
    return ','
}

const parseCSV = (text: string, delimiter: string): string[][] => {
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
            if (char === '\r' && nextChar === '\n') i++
            row.push(value)
            value = ''
            if (row.some((cell) => cell.trim() !== '')) rows.push(row)
            row = []
            continue
        }

        value += char
    }

    if (value !== '' || row.length > 0) {
        row.push(value)
        if (row.some((cell) => cell.trim() !== '')) rows.push(row)
    }

    return rows
}

const getFieldByHeader = (header: string): CsvField | null => {
    const normalizedHeader = normalize(header)
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
        if (aliases.some((alias) => normalize(alias) === normalizedHeader)) {
            return field as CsvField
        }
    }
    return null
}

const tryParseStatus = (value: string): ApplicationStatus | null => {
    const normalizedValue = normalize(value)
    for (const [status, aliases] of Object.entries(STATUS_ALIASES)) {
        if (aliases.some((alias) => normalize(alias) === normalizedValue)) {
            return status as ApplicationStatus
        }
    }
    return null
}

const tryParseDate = (value: string): string | null => {
    const normalizedValue = value.trim()
    if (!normalizedValue) return ''

    const europeanMatch = normalizedValue.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
    if (europeanMatch) {
        const [, day, month, year] = europeanMatch
        const date = new Date(Number(year), Number(month) - 1, Number(day))
        const isValid =
            date.getFullYear() === Number(year) &&
            date.getMonth() === Number(month) - 1 &&
            date.getDate() === Number(day)
        return isValid ? `${year}-${month}-${day}` : null
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) return normalizedValue
    return null
}

type ParsedRow = {
    rowNumber: number
    data: Partial<ImportApplication>
    errors: string[]
}

type ParseResult = {
    columnMapping: Partial<Record<CsvField, string>>
    missingRequiredColumns: CsvField[]
    rows: ParsedRow[]
}

/**
 * Только разбор и валидация. Ничего не создаёт и не бросает исключений
 * на уровне отдельных строк — все проблемы собираются в row.errors,
 * чтобы их можно было показать в предпросмотре.
 */
export const parseApplicationsCSV = async (
    file: File,
): Promise<ParseResult> => {
    const text = await file.text()

    if (!text.trim()) {
        return {columnMapping: {}, missingRequiredColumns: REQUIRED_FIELDS, rows: []}
    }

    const delimiter = detectDelimiter(text)
    const rows = parseCSV(text, delimiter)

    if (rows.length < 2) {
        return {columnMapping: {}, missingRequiredColumns: REQUIRED_FIELDS, rows: []}
    }

    const headers = rows[0]
    const fieldIndexes = new Map<CsvField, number>()
    const columnMapping: Partial<Record<CsvField, string>> = {}

    headers.forEach((header, index) => {
        const field = getFieldByHeader(header)
        if (field) {
            fieldIndexes.set(field, index)
            columnMapping[field] = header.trim()
        }
    })

    const missingRequiredColumns = REQUIRED_FIELDS.filter(
        (field) => !fieldIndexes.has(field),
    )

    const getValue = (row: string[], field: CsvField): string => {
        const index = fieldIndexes.get(field)
        if (index === undefined) return ''
        return row[index]?.trim() ?? ''
    }

    const parsedRows: ParsedRow[] = rows.slice(1).map((row, index) => {
        const rowNumber = index + 2
        const errors: string[] = []
        const data: Partial<ImportApplication> = {}

        const companyName = getValue(row, 'company_name')
        if (!companyName) {
            errors.push('Company is empty.')
        } else {
            data.company_name = companyName
        }

        const statusRaw = getValue(row, 'status')
        if (!statusRaw) {
            errors.push('Status is empty.')
        } else {
            const status = tryParseStatus(statusRaw)
            if (status === null) {
                errors.push(`Unknown status "${statusRaw}".`)
            } else {
                data.status = status
            }
        }

        const dateRaw = getValue(row, 'applied_at')
        const date = tryParseDate(dateRaw)
        if (date === null) {
            errors.push(`Invalid date "${dateRaw}". Expected DD.MM.YYYY.`)
        } else {
            data.applied_at = date
        }

        data.description = getValue(row, 'description')
        data.url = getValue(row, 'url')
        data.notes = getValue(row, 'notes')

        return {rowNumber, data, errors}
    })

    return {columnMapping, missingRequiredColumns, rows: parsedRows}
}

/**
 * Второй шаг — вызывается после подтверждения пользователем.
 * Возвращает только валидные (или явно отмеченные) строки.
 */
export const commitParsedRows = (
    result: ParseResult,
    includeRowNumbers?: Set<number>,
): ImportApplication[] => {
    return result.rows
        .filter((row) => row.errors.length === 0)
        .filter((row) => !includeRowNumbers || includeRowNumbers.has(row.rowNumber))
        .map((row) => row.data as ImportApplication)
}

export type {ImportApplication, ParseResult, ParsedRow, CsvField, ApplicationStatus}