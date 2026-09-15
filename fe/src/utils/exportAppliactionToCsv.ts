import type {Application, ApplicationStatus} from '../types/application.ts'

export interface CsvExportStrings {
    headers: {
        company: string
        position: string
        jobUrl: string
        notes: string
        date: string
        status: string
    }
    statusLabels: Record<ApplicationStatus, string>
    locale: string
    filename: string
}

function escapeCsvField(value: string): string {
    if (/[",\n;]/.test(value)) {
        return `"${value.replace(/"/g, '""')}"`
    }

    return value
}

export function exportApplicationsToCSV(
    applications: Application[],
    strings: CsvExportStrings
) {
    if (applications.length === 0) {
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

    const rows = applications.map((application) => [
        application.company_name,
        application.description,
        application.url ?? '',
        application.notes ?? '',
        application.applied_at
            ? new Date(application.applied_at).toLocaleDateString(
                  strings.locale
              )
            : '',
        strings.statusLabels[application.status],
    ])

    const csvContent = [headerRow, ...rows]
        .map((row) =>
            row.map((field) => escapeCsvField(String(field))).join(',')
        )
        .join('\r\n')

    // UTF-8 BOM, damit Excel kyrillischen Text korrekt anzeigt
    const blob = new Blob(['\uFEFF' + csvContent], {
        type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = strings.filename

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
}