import type {
    Application,
    ApplicationStatus,
} from '@/types/application.ts'

export interface CsvExportStrings {
    headers: {
        company: string
        position: string
        jobUrl: string
        notes: string
        date: string
        status: string
    }

    statusLabels: Record<
        ApplicationStatus,
        string
    >

    filename: string
}

/**
 * Всегда возвращает:
 *
 * DD.MM.YYYY
 *
 * Независимо от языка браузера.
 */
function formatDate(
    value: string | null | undefined
): string {
    if (!value) {
        return ''
    }

    const text = String(value).trim()

    /*
     * Если API уже отдаёт:
     * 2026-09-23
     * 2026-09-23T00:00:00Z
     *
     * Берём только YYYY-MM-DD.
     *
     * Это важно: мы НЕ используем new Date(),
     * поэтому timezone браузера не может изменить дату.
     */
    const isoMatch = text.match(
        /^(\d{4})-(\d{2})-(\d{2})/
    )

    if (isoMatch) {
        const [, year, month, day] =
            isoMatch

        return `${day}.${month}.${year}`
    }

    /*
     * Если дата уже:
     * 23.09.2026
     */
    const dotMatch = text.match(
        /^(\d{2})\.(\d{2})\.(\d{4})/
    )

    if (dotMatch) {
        return text.slice(0, 10)
    }

    /*
     * Если дата:
     * 23/09/2026
     */
    const slashDayFirstMatch =
        text.match(
            /^(\d{2})\/(\d{2})\/(\d{4})/
        )

    if (slashDayFirstMatch) {
        const [
            ,
            day,
            month,
            year,
        ] = slashDayFirstMatch

        return `${day}.${month}.${year}`
    }

    /*
     * Если дата:
     * 09/23/2026
     *
     * Предполагаем американский MM/DD/YYYY.
     */
    const slashMonthFirstMatch =
        text.match(
            /^(\d{2})\/(\d{2})\/(\d{4})/
        )

    if (slashMonthFirstMatch) {
        const [
            ,
            month,
            day,
            year,
        ] = slashMonthFirstMatch

        return `${day}.${month}.${year}`
    }

    /*
     * Последняя попытка.
     *
     * Используем Date только если API
     * прислал неизвестный формат.
     */
    const date = new Date(text)

    if (!Number.isNaN(date.getTime())) {
        const day = String(
            date.getUTCDate()
        ).padStart(2, '0')

        const month = String(
            date.getUTCMonth() + 1
        ).padStart(2, '0')

        const year =
            date.getUTCFullYear()

        return `${day}.${month}.${year}`
    }

    return ''
}

function escapeCsvField(
    value: string
): string {
    if (
        /[",;\r\n]/.test(value)
    ) {
        return `"${value.replace(
            /"/g,
            '""'
        )}"`
    }

    return value
}

export function exportApplicationsToCSV(
    applications: Application[],
    strings: CsvExportStrings
): void {
    if (
        applications.length === 0
    ) {
        return
    }

    const headerRow = [
        strings.headers.company,
        strings.headers.position,
        strings.headers.jobUrl,
        strings.headers.notes,
        strings.headers.date,
        strings.headers.status,
    ]

    const rows = applications.map(
        (application) => [
            application.company_name ??
                '',

            application.description ??
                '',

            application.url ?? '',

            application.notes ?? '',

            formatDate(
                application.applied_at
            ),

            strings.statusLabels[
                application.status
            ] ?? '',
        ]
    )

    const csvContent = [
        headerRow,
        ...rows,
    ]
        .map((row) =>
            row
                .map((field) =>
                    escapeCsvField(
                        String(field)
                    )
                )
                .join(',')
        )
        .join('\r\n')

    /*
     * BOM для Excel.
     */
    const blob = new Blob(
        [
            '\uFEFF' +
                csvContent,
        ],
        {
            type:
                'text/csv;charset=utf-8',
        }
    )

    const url =
        URL.createObjectURL(blob)

    const link =
        document.createElement('a')

    link.href = url

    link.download =
        strings.filename

    document.body.appendChild(
        link
    )

    link.click()

    document.body.removeChild(
        link
    )

    URL.revokeObjectURL(url)
}
