import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type {
    Application,
    ApplicationStatus,
} from '@/types/application.ts'

/**
 * Formats date consistently for PDF.
 *
 * Always returns:
 *
 * DD.MM.YYYY
 *
 * Example:
 * 23.09.2026
 */
function formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()

    return `${day}.${month}.${year}`
}

/**
 * Loads a TTF font from public/fonts and converts it to Base64.
 *
 * Expected file:
 * public/fonts/NotoSans-Medium.ttf
 */
async function loadFontAsBase64(
    url: string
): Promise<string> {
    const response = await fetch(url)

    if (!response.ok) {
        throw new Error(
            `Failed to load PDF font: ${url} (${response.status})`
        )
    }

    const arrayBuffer = await response.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)

    let binary = ''

    // Avoid String.fromCharCode(...bytes) because it can overflow
    // the call stack for larger font files.
    const chunkSize = 0x8000

    for (
        let i = 0;
        i < bytes.length;
        i += chunkSize
    ) {
        const chunk = bytes.subarray(
            i,
            Math.min(i + chunkSize, bytes.length)
        )

        binary += String.fromCharCode(...chunk)
    }

    return btoa(binary)
}

export interface PdfExportStrings {
    title: string
    subtitle: string
    total: string
    pending: string
    accepted: string
    rejected: string

    headers: {
        company: string
        position: string
        date: string
        status: string
    }

    statusLabels: Record<
        ApplicationStatus,
        string
    >

    pageOf: (
        page: number,
        pageCount: number
    ) => string

    createdOn: (
        date: string
    ) => string

    filename: string
}

export async function exportApplicationsToPDF(
    applications: Application[],
    strings: PdfExportStrings
): Promise<void> {
    if (applications.length === 0) {
        return
    }

    /*
     * Load Unicode font.
     *
     * Put the file here:
     *
     * public/fonts/NotoSans-Medium.ttf
     *
     * The font must contain Cyrillic/Ukrainian glyphs.
     */
    const fontBase64 =
        await loadFontAsBase64(
            '/fonts/NotoSans-Medium.ttf'
        )

    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
    })

    /*
     * Register Noto Sans in jsPDF.
     */
    doc.addFileToVFS(
        'NotoSans-Medium.ttf',
        fontBase64
    )

    doc.addFont(
        'NotoSans-Medium.ttf',
        'NotoSans',
        'normal'
    )

    // Use Unicode font everywhere.
    doc.setFont(
        'NotoSans',
        'normal'
    )

    const total = applications.length

    const pending = applications.filter(
        (application) =>
            application.status === 'pending'
    ).length

    const accepted = applications.filter(
        (application) =>
            application.status === 'accepted'
    ).length

    const rejected = applications.filter(
        (application) =>
            application.status === 'rejected'
    ).length

    /*
     * Header
     */
    doc.setTextColor(
        24,
        24,
        27
    )

    doc.setFont(
        'NotoSans',
        'normal'
    )

    doc.setFontSize(22)

    doc.text(
        strings.title,
        14,
        18
    )

    doc.setFontSize(10)

    doc.setTextColor(
        113,
        113,
        122
    )

    doc.text(
        strings.subtitle,
        14,
        25
    )

    /*
     * Statistics
     */
    const statsY = 36

    doc.setFontSize(10)

    doc.setTextColor(
        63,
        63,
        70
    )

    doc.setFont(
        'NotoSans',
        'normal'
    )

    doc.text(
        strings.total,
        14,
        statsY
    )

    doc.text(
        String(total),
        14,
        statsY + 6
    )

    doc.text(
        strings.pending,
        55,
        statsY
    )

    doc.text(
        String(pending),
        55,
        statsY + 6
    )

    doc.text(
        strings.accepted,
        95,
        statsY
    )

    doc.text(
        String(accepted),
        95,
        statsY + 6
    )

    doc.text(
        strings.rejected,
        145,
        statsY
    )

    doc.text(
        String(rejected),
        145,
        statsY + 6
    )

    /*
     * Table
     */
    autoTable(doc, {
        startY: 50,

        head: [
            [
                strings.headers.company,
                strings.headers.position,
                strings.headers.date,
                strings.headers.status,
            ],
        ],

        body: applications.map(
            (application) => [
                application.company_name,

                application.description,

                application.applied_at
                    ? formatDate(
                        new Date(
                            application.applied_at
                        )
                    )
                    : '—',

                strings.statusLabels[
                    application.status
                ],
            ]
        ),

        theme: 'grid',

        styles: {
            font: 'NotoSans',
            fontSize: 9,
            cellPadding: 4,

            textColor: [
                63,
                63,
                70,
            ],

            lineColor: [
                228,
                228,
                231,
            ],

            lineWidth: 0.2,

            valign: 'middle',
        },

        headStyles: {
            fillColor: [
                250,
                250,
                250,
            ],

            textColor: [
                82,
                82,
                91,
            ],

            font: 'NotoSans',

            fontStyle: 'normal',

            lineColor: [
                228,
                228,
                231,
            ],

            lineWidth: 0.2,
        },

        alternateRowStyles: {
            fillColor: [
                252,
                252,
                253,
            ],
        },

        columnStyles: {
            0: {
                font: 'NotoSans',

                fontStyle:
                    'normal',

                textColor: [
                    24,
                    24,
                    27,
                ],
            },
        },

        tableWidth: 'auto',

        margin: {
            left: 14,
            right: 14,
        },
    })

    /*
     * Footer
     */
    const pageCountPdf =
        doc.getNumberOfPages()

    for (
        let pdfPage = 1;
        pdfPage <= pageCountPdf;
        pdfPage++
    ) {
        doc.setPage(pdfPage)

        const pageWidth =
            doc.internal.pageSize.getWidth()

        const pageHeight =
            doc.internal.pageSize.getHeight()

        /*
         * Footer line
         */
        doc.setDrawColor(
            228,
            228,
            231
        )

        doc.line(
            14,
            pageHeight - 16,
            pageWidth - 14,
            pageHeight - 16
        )

        /*
         * Page number
         */
        doc.setFont(
            'NotoSans',
            'normal'
        )

        doc.setFontSize(8)

        doc.setTextColor(
            161,
            161,
            170
        )

        doc.text(
            strings.pageOf(
                pdfPage,
                pageCountPdf
            ),
            14,
            pageHeight - 9
        )

        /*
         * Creation date
         *
         * Always DD.MM.YYYY
         */
        const dateText =
            strings.createdOn(
                formatDate(
                    new Date()
                )
            )

        doc.text(
            dateText,
            pageWidth - 14,
            pageHeight - 9,
            {
                align: 'right',
            }
        )
    }

    /*
     * Download
     */
    doc.save(
        strings.filename
    )
}
