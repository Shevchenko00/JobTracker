import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type {Application} from '../types/application.ts'
import {statusLabels} from '../types/status.ts'

export function exportApplicationsToPDF(applications: Application[]) {
    if (applications.length === 0) {
        return
    }

    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
    })

    const total = applications.length

    const pending = applications.filter(
        (app) => app.status === 'pending'
    ).length

    const accepted = applications.filter(
        (app) => app.status === 'accepted'
    ).length

    const rejected = applications.filter(
        (app) => app.status === 'rejected'
    ).length

    /*
     * Header
     */
    doc.setTextColor(24, 24, 27)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)

    doc.text('Meine Bewerbungen', 14, 18)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(113, 113, 122)

    doc.text('Übersicht meiner Bewerbungen', 14, 25)

    /*
     * Statistics
     */
    const statsY = 36

    doc.setFontSize(10)
    doc.setTextColor(63, 63, 70)

    doc.setFont('helvetica', 'bold')
    doc.text('Gesamt', 14, statsY)

    doc.setFont('helvetica', 'normal')
    doc.text(String(total), 14, statsY + 6)

    doc.setFont('helvetica', 'bold')
    doc.text('Offen', 55, statsY)

    doc.setFont('helvetica', 'normal')
    doc.text(String(pending), 55, statsY + 6)

    doc.setFont('helvetica', 'bold')
    doc.text('Einladungen', 95, statsY)

    doc.setFont('helvetica', 'normal')
    doc.text(String(accepted), 95, statsY + 6)

    doc.setFont('helvetica', 'bold')
    doc.text('Absagen', 145, statsY)

    doc.setFont('helvetica', 'normal')
    doc.text(String(rejected), 145, statsY + 6)

    /*
     * Table
     */
    autoTable(doc, {
        startY: 50,

        head: [
            ['Unternehmen', 'Position / Beschreibung', 'Datum', 'Status'],
        ],

        body: applications.map((application) => [
            application.company_name,
            application.description,
            new Date(application.applied_at).toLocaleDateString('de-DE'),
            statusLabels[application.status],
        ]),

        theme: 'grid',

        styles: {
            font: 'helvetica',
            fontSize: 9,
            cellPadding: 4,
            textColor: [63, 63, 70],
            lineColor: [228, 228, 231],
            lineWidth: 0.2,
            valign: 'middle',
        },

        headStyles: {
            fillColor: [250, 250, 250],
            textColor: [82, 82, 91],
            fontStyle: 'bold',
            lineColor: [228, 228, 231],
            lineWidth: 0.2,
        },

        alternateRowStyles: {
            fillColor: [252, 252, 253],
        },

        columnStyles: {
            0: {
                cellWidth: 55,
                fontStyle: 'bold',
                textColor: [24, 24, 27],
            },

            1: {
                cellWidth: 105,
            },

            2: {
                cellWidth: 35,
            },

            3: {
                cellWidth: 45,
            },
        },

        margin: {
            left: 14,
            right: 14,
        },
    })

    /*
     * Footer
     */
    const pageCountPdf = doc.getNumberOfPages()

    for (let pdfPage = 1; pdfPage <= pageCountPdf; pdfPage++) {
        doc.setPage(pdfPage)

        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()

        doc.setDrawColor(228, 228, 231)

        doc.line(14, pageHeight - 16, pageWidth - 14, pageHeight - 16)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(161, 161, 170)

        doc.text(`Seite ${pdfPage} von ${pageCountPdf}`, 14, pageHeight - 9)

        const dateText = `Erstellt am ${new Date().toLocaleDateString('de-DE')}`

        doc.text(dateText, pageWidth - 14, pageHeight - 9, {
            align: 'right',
        })
    }

    /*
     * Download
     */
    doc.save('meine-bewerbungen.pdf')
}