import { useEffect, useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import styles from './App.module.scss'

type ApplicationStatus = 'pending' | 'accepted' | 'rejected'

type Application = {
    id: number
    company_name: string
    description: string
    applied_at: string
    status: ApplicationStatus
}

const statusLabels: Record<ApplicationStatus, string> = {
    pending: 'In Bearbeitung',
    accepted: 'Einladung',
    rejected: 'Absage',
}

const getTodayDateString = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

function App() {
    const [applications, setApplications] =
        useState<Application[]>([])

    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState(false)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(
        null
    )

    const [company, setCompany] = useState('')
    const [description, setDescription] = useState('')
    const [appliedAt, setAppliedAt] = useState(
        getTodayDateString()
    )
    const [result, setResult] =
        useState<ApplicationStatus>('pending')

    const isEditing = editingId !== null

    useEffect(() => {
        const fetchApplications = async () => {
            setIsLoading(true)
            setLoadError(false)

            try {
                const response = await fetch(
                    'http://localhost:9212/jobs/'
                )

                if (!response.ok) {
                    throw new Error(
                        `Ошибка загрузки заявок: ${response.status}`
                    )
                }

                const data: Application[] =
                    await response.json()

                setApplications(data)
            } catch (error) {
                console.error(
                    'Ошибка при загрузке заявок:',
                    error
                )

                setLoadError(true)
            } finally {
                setIsLoading(false)
            }
        }

        fetchApplications()
    }, [])

    const resetForm = () => {
        setCompany('')
        setDescription('')
        setAppliedAt(getTodayDateString())
        setResult('pending')
        setEditingId(null)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        resetForm()
    }

    const handleOpenCreateModal = () => {
        resetForm()
        setIsModalOpen(true)
    }

    const handleOpenEditModal = (
        application: Application
    ) => {
        setEditingId(application.id)
        setCompany(application.company_name)
        setDescription(application.description)
        setAppliedAt(
            application.applied_at.slice(0, 10)
        )
        setResult(application.status)
        setIsModalOpen(true)
    }

    const handleDeleteApplication = async (id: number) => {
        try {
            const response = await fetch(
                `http://localhost:9212/jobs/delete/${id}/`,
                {
                    method: 'DELETE',
                }
            )

            if (!response.ok) {
                throw new Error(
                    `Ошибка удаления заявки: ${response.status}`
                )
            }

            setApplications((prev) =>
                prev.filter(
                    (application) =>
                        application.id !== id
                )
            )
        } catch (error) {
            console.error(
                'Ошибка при удалении заявки:',
                error
            )
        }
    }

    const handleCreateApplication = async () => {
        try {
            const response = await fetch(
                'http://localhost:9212/jobs/create/',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        company_name: company,
                        description,
                        applied_at: appliedAt,
                        status: result,
                    }),
                }
            )

            if (!response.ok) {
                throw new Error(
                    `Ошибка создания заявки: ${response.status}`
                )
            }

            const newApplication: Application =
                await response.json()

            setApplications((prev) => [
                ...prev,
                newApplication,
            ])
        } catch (error) {
            console.error(
                'Ошибка при создании заявки:',
                error
            )
        }
    }

    const handleUpdateApplication = async (id: number) => {
        try {
            const response = await fetch(
                `http://localhost:9212/jobs/update/${id}/`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        company_name: company,
                        description,
                        applied_at: appliedAt,
                        status: result,
                    }),
                }
            )

            if (!response.ok) {
                throw new Error(
                    `Ошибка обновления заявки: ${response.status}`
                )
            }

            const updatedApplication: Application =
                await response.json()

            setApplications((prev) =>
                prev.map((application) =>
                    application.id === id
                        ? updatedApplication
                        : application
                )
            )
        } catch (error) {
            console.error(
                'Ошибка при обновлении заявки:',
                error
            )
        }
    }

    const handleSubmit = async () => {
        if (
            !company.trim() ||
            !description.trim() ||
            !appliedAt
        ) {
            return
        }

        if (isEditing && editingId !== null) {
            await handleUpdateApplication(editingId)
        } else {
            await handleCreateApplication()
        }

        handleCloseModal()
    }

    const handleExportPDF = () => {
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

        doc.text(
            'Übersicht meiner Bewerbungen',
            14,
            25
        )

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
                [
                    'Unternehmen',
                    'Position / Beschreibung',
                    'Datum',
                    'Status',
                ],
            ],

            body: applications.map((application) => [
                application.company_name,
                application.description,
                new Date(
                    application.applied_at
                ).toLocaleDateString('de-DE'),
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
        const pageCount = doc.getNumberOfPages()

        for (let page = 1; page <= pageCount; page++) {
            doc.setPage(page)

            const pageWidth =
                doc.internal.pageSize.getWidth()

            const pageHeight =
                doc.internal.pageSize.getHeight()

            doc.setDrawColor(228, 228, 231)

            doc.line(
                14,
                pageHeight - 16,
                pageWidth - 14,
                pageHeight - 16
            )

            doc.setFont('helvetica', 'normal')
            doc.setFontSize(8)
            doc.setTextColor(161, 161, 170)

            doc.text(
                `Seite ${page} von ${pageCount}`,
                14,
                pageHeight - 9
            )

            const dateText =
                `Erstellt am ${new Date().toLocaleDateString('de-DE')}`

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
        doc.save('meine-bewerbungen.pdf')
    }

    return (
        <main className={styles.app}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <div>
                        <h1 className={styles.title}>
                            Meine Bewerbungen
                        </h1>

                        <p className={styles.subtitle}>
                            Ubersicht meiner Bewerbungen
                        </p>
                    </div>

                    <div className={styles.headerActions}>
                        <button
                            className={styles.exportButton}
                            onClick={handleExportPDF}
                            disabled={
                                applications.length === 0 ||
                                isLoading
                            }
                            type="button"
                        >
                            <span>↓</span>
                            PDF exportieren
                        </button>

                        <button
                            className={styles.createButton}
                            onClick={handleOpenCreateModal}
                            type="button"
                        >
                            <span>+</span>
                            Bewerbung hinzufugen
                        </button>
                    </div>
                </header>

                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                        <tr>
                            <th>Unternehmen</th>
                            <th>Position / Beschreibung</th>
                            <th>Bewerbungsdatum</th>
                            <th>Status</th>
                            <th className={styles.actionsHead} />
                        </tr>
                        </thead>
                        <tbody>
                        {isLoading ? (
                            <tr>
                                <td
                                    className={styles.empty}
                                    colSpan={5}
                                >
                                    Bewerbungen werden geladen...
                                </td>
                            </tr>
                        ) : loadError ? (
                            <tr>
                                <td
                                    className={styles.empty}
                                    colSpan={5}
                                >
                                    Bewerbungen konnten nicht geladen werden.
                                    <br />
                                    Bitte versuchen Sie es erneut.
                                </td>
                            </tr>
                        ) : applications.length !== 0 ? (
                            applications.map(
                                (application) => (
                                    <tr
                                        key={
                                            application.id
                                        }
                                    >
                                        <td
                                            className={
                                                styles.company
                                            }
                                        >
                                            {
                                                application.company_name
                                            }
                                        </td>

                                        <td>
                                            {
                                                application.description
                                            }
                                        </td>

                                        <td
                                            className={
                                                styles.date
                                            }
                                        >
                                            {new Date(
                                                application.applied_at
                                            ).toLocaleDateString(
                                                'ru-RU'
                                            )}
                                        </td>

                                        <td>
                                                <span
                                                    className={`${styles.status} ${
                                                        application.status ===
                                                        'accepted'
                                                            ? styles.success
                                                            : application.status ===
                                                            'rejected'
                                                                ? styles.rejected
                                                                : styles.pending
                                                    }`}
                                                >
                                                    {
                                                        statusLabels[
                                                            application
                                                                .status
                                                            ]
                                                    }
                                                </span>
                                        </td>

                                        <td
                                            className={
                                                styles.actions
                                            }
                                        >
                                            <button
                                                className={styles.editButton}
                                                onClick={() =>
                                                    handleOpenEditModal(application)
                                                }
                                                aria-label="Bewerbung bearbeiten"
                                                title="Bewerbung bearbeiten"
                                                type="button"
                                            >
                                                ✎
                                            </button>

                                            <button
                                                className={styles.deleteButton}
                                                onClick={() =>
                                                    handleDeleteApplication(application.id)
                                                }
                                                aria-label="Bewerbung loschen"
                                                title="Bewerbung loschen"
                                                type="button"
                                            >
                                                ×
                                            </button>
                                        </td>
                                    </tr>
                                )
                            )
                        ) : (
                            <tr>
                                <td
                                    className={styles.empty}
                                    colSpan={5}
                                >
                                    Noch keine Bewerbungen vorhanden
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div
                    className={styles.overlay}
                    onClick={handleCloseModal}
                >
                    <div
                        className={styles.modal}
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <div className={styles.modalHeader}>
                            <div>
                                <h2>
                                    {isEditing
                                        ? 'Bewerbung bearbeiten'
                                        : 'Bewerbung hinzufugen'}
                                </h2>

                                <p>
                                    {isEditing
                                        ? 'Andern Sie die Angaben zu Ihrer Bewerbung'
                                        : 'Tragen Sie die Angaben zu Ihrer Bewerbung ein'}
                                </p>
                            </div>

                            <button
                                className={styles.closeButton}
                                onClick={handleCloseModal}
                                aria-label="Schliessen"
                                title="Schliessen"
                                type="button"
                            >
                                ×
                            </button>
                        </div>

                        <form
                            className={styles.form}
                            onSubmit={(event) => {
                                event.preventDefault()
                                handleSubmit()
                            }}
                        >
                            <label>
                                Unternehmen

                                <input
                                    type="text"
                                    placeholder="Zum Beispiel Google"
                                    value={company}
                                    onChange={(event) =>
                                        setCompany(event.target.value)
                                    }
                                />
                            </label>

                            <label>
                                Position / Beschreibung

                                <input
                                    type="text"
                                    placeholder="Zum Beispiel Frontend Developer"
                                    value={description}
                                    onChange={(event) =>
                                        setDescription(event.target.value)
                                    }
                                />
                            </label>

                            <label>
                                Bewerbungsdatum

                                <input
                                    type="date"
                                    value={appliedAt}
                                    onChange={(event) =>
                                        setAppliedAt(event.target.value)
                                    }
                                />
                            </label>

                            <label>
                                Status

                                <select
                                    value={result}
                                    onChange={(event) =>
                                        setResult(
                                            event.target.value as ApplicationStatus
                                        )
                                    }
                                >
                                    <option value="pending">
                                        In Bearbeitung
                                    </option>

                                    <option value="accepted">
                                        Einladung
                                    </option>

                                    <option value="rejected">
                                        Absage
                                    </option>
                                </select>
                            </label>

                            <button
                                type="submit"
                                className={styles.submitButton}
                            >
                                {isEditing
                                    ? 'Anderungen speichern'
                                    : 'Bewerbung erstellen'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </main>
    )
}

export default App