import { useEffect, useMemo, useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import styles from './App.module.scss'

type ApplicationStatus = 'pending' | 'accepted' | 'rejected'
type Ordering = 'applied_at' | '-applied_at' | 'company_name' | '-company_name'

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

const statusOrder: ApplicationStatus[] = ['pending', 'accepted', 'rejected']

const orderingLabels: Record<Ordering, string> = {
    '-applied_at': 'Neueste zuerst',
    applied_at: 'Älteste zuerst',
    company_name: 'Unternehmen A-Z',
    '-company_name': 'Unternehmen Z-A',
}

const getTodayDateString = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

const API_BASE = 'http://localhost:9212/jobs'

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

    // --- Filter ---
    const [searchInput, setSearchInput] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [activeStatuses, setActiveStatuses] = useState<
        ApplicationStatus[]
    >([])
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [ordering, setOrdering] =
        useState<Ordering>('-applied_at')
    const [isFiltersOpen, setIsFiltersOpen] = useState(false)

    const isEditing = editingId !== null

    const hasActiveFilters =
        searchQuery.trim() !== '' ||
        activeStatuses.length > 0 ||
        dateFrom !== '' ||
        dateTo !== ''

    // Debounce der Freitextsuche, damit nicht bei jedem Tastenanschlag ein Request rausgeht
    useEffect(() => {
        const timeout = setTimeout(() => {
            setSearchQuery(searchInput.trim())
        }, 350)

        return () => clearTimeout(timeout)
    }, [searchInput])

    const buildQueryString = () => {
        const params = new URLSearchParams()

        if (searchQuery) {
            params.set('search', searchQuery)
        }

        if (activeStatuses.length > 0) {
            params.set('status', activeStatuses.join(','))
        }

        if (dateFrom) {
            params.set('date_from', dateFrom)
        }

        if (dateTo) {
            params.set('date_to', dateTo)
        }

        if (ordering) {
            params.set('ordering', ordering)
        }

        const query = params.toString()

        return query ? `?${query}` : ''
    }

    useEffect(() => {
        const fetchApplications = async () => {
            setIsLoading(true)
            setLoadError(false)

            try {
                const response = await fetch(
                    `${API_BASE}/${buildQueryString()}`
                )

                if (!response.ok) {
                    throw new Error(
                        `Fehler beim Laden der Bewerbungen: ${response.status}`
                    )
                }

                const data: Application[] =
                    await response.json()

                setApplications(data)
            } catch (error) {
                console.error(
                    'Fehler beim Laden der Bewerbungen:',
                    error
                )

                setLoadError(true)
            } finally {
                setIsLoading(false)
            }
        }

        fetchApplications()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, activeStatuses, dateFrom, dateTo, ordering])

    const toggleStatusFilter = (status: ApplicationStatus) => {
        setActiveStatuses((prev) =>
            prev.includes(status)
                ? prev.filter((item) => item !== status)
                : [...prev, status]
        )
    }

    const handleResetFilters = () => {
        setSearchInput('')
        setSearchQuery('')
        setActiveStatuses([])
        setDateFrom('')
        setDateTo('')
        setOrdering('-applied_at')
    }

    const statusCounts = useMemo(() => {
        return applications.reduce(
            (acc, application) => {
                acc[application.status] += 1
                return acc
            },
            { pending: 0, accepted: 0, rejected: 0 } as Record<
                ApplicationStatus,
                number
            >
        )
    }, [applications])

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
                `${API_BASE}/delete/${id}/`,
                {
                    method: 'DELETE',
                }
            )

            if (!response.ok) {
                throw new Error(
                    `Fehler beim Löschen der Bewerbung: ${response.status}`
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
                'Fehler beim Löschen der Bewerbung:',
                error
            )
        }
    }

    const handleCreateApplication = async () => {
        try {
            const response = await fetch(
                `${API_BASE}/create/`,
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
                    `Fehler beim Erstellen der Bewerbung: ${response.status}`
                )
            }

            const newApplication: Application =
                await response.json()

            setApplications((prev) => [
                newApplication,
                ...prev,
            ])
        } catch (error) {
            console.error(
                'Fehler beim Erstellen der Bewerbung:',
                error
            )
        }
    }

    const handleUpdateApplication = async (id: number) => {
        try {
            const response = await fetch(
                `${API_BASE}/update/${id}/`,
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
                    `Fehler beim Aktualisieren der Bewerbung: ${response.status}`
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
                'Fehler beim Aktualisieren der Bewerbung:',
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
                            Übersicht meiner Bewerbungen
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
                            Bewerbung hinzufügen
                        </button>
                    </div>
                </header>

                {/* --- Filterleiste --- */}
                <section className={styles.filtersBar}>
                    <div className={styles.searchField}>
                        <span className={styles.searchIcon}>⚲</span>

                        <input
                            type="text"
                            placeholder="Suche nach Unternehmen oder Position..."
                            value={searchInput}
                            onChange={(event) =>
                                setSearchInput(event.target.value)
                            }
                        />

                        {searchInput && (
                            <button
                                type="button"
                                className={styles.clearSearch}
                                onClick={() => setSearchInput('')}
                                aria-label="Suche löschen"
                            >
                                ×
                            </button>
                        )}
                    </div>

                    <div className={styles.statusPills}>
                        {statusOrder.map((status) => (
                            <button
                                key={status}
                                type="button"
                                className={`${styles.pill} ${
                                    activeStatuses.includes(status)
                                        ? styles.pillActive
                                        : ''
                                } ${styles[`pill_${status}`]}`}
                                onClick={() =>
                                    toggleStatusFilter(status)
                                }
                            >
                                {statusLabels[status]}
                                <span className={styles.pillCount}>
                                    {statusCounts[status]}
                                </span>
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        className={styles.toggleFiltersButton}
                        onClick={() =>
                            setIsFiltersOpen((prev) => !prev)
                        }
                    >
                        Datum & Sortierung {isFiltersOpen ? '▲' : '▼'}
                    </button>

                    {hasActiveFilters && (
                        <button
                            type="button"
                            className={styles.resetFiltersButton}
                            onClick={handleResetFilters}
                        >
                            Filter zurücksetzen
                        </button>
                    )}
                </section>

                {isFiltersOpen && (
                    <section className={styles.filtersExpanded}>
                        <label>
                            Datum von

                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(event) =>
                                    setDateFrom(event.target.value)
                                }
                            />
                        </label>

                        <label>
                            Datum bis

                            <input
                                type="date"
                                value={dateTo}
                                onChange={(event) =>
                                    setDateTo(event.target.value)
                                }
                            />
                        </label>

                        <label>
                            Sortierung

                            <select
                                value={ordering}
                                onChange={(event) =>
                                    setOrdering(
                                        event.target
                                            .value as Ordering
                                    )
                                }
                            >
                                {Object.entries(orderingLabels).map(
                                    ([value, label]) => (
                                        <option
                                            key={value}
                                            value={value}
                                        >
                                            {label}
                                        </option>
                                    )
                                )}
                            </select>
                        </label>
                    </section>
                )}

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
                                                'de-DE'
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
                                                aria-label="Bewerbung löschen"
                                                title="Bewerbung löschen"
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
                                    {hasActiveFilters
                                        ? 'Für die gewählten Filter wurde nichts gefunden'
                                        : 'Noch keine Bewerbungen vorhanden'}
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
                                        : 'Bewerbung hinzufügen'}
                                </h2>

                                <p>
                                    {isEditing
                                        ? 'Ändern Sie die Angaben zu Ihrer Bewerbung'
                                        : 'Tragen Sie die Angaben zu Ihrer Bewerbung ein'}
                                </p>
                            </div>

                            <button
                                className={styles.closeButton}
                                onClick={handleCloseModal}
                                aria-label="Schließen"
                                title="Schließen"
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
                                    ? 'Änderungen speichern'
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