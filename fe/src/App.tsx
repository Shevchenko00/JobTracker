import {useState} from 'react'
import {useTranslation} from 'react-i18next'
import styles from './App.module.scss'
import {useApplications} from './hooks/useApplications.ts'
import {useApplicationForm} from './hooks/useApplicationsForm.ts'
import {useStatusLabels} from './hooks/useStatusLabel.ts'
import {exportApplicationsToPDF} from './utils/exportApplicationsToPDF.ts'
import {resolvePdfLocale} from './utils/resolvePdfLocale.ts'
import FiltersBar from './components/FilterBar/FilterBar.tsx'
import ApplicationsTable from './components/ApplicationsTable/ApplicationsTable.tsx'
import Pagination from './components/Pagination/Pagination.tsx'
import ApplicationModal from './components/ApplicationsModal/ApplicationsModal.tsx'
import LanguageSwitcher from './components/LanguageSwitcher/LanguageSwitcher.tsx'
import ThemeToggle from './components/ThemeToggle/ThemeToggle.tsx'
import type {Application} from './types/application.ts'
import {exportApplicationsToCSV} from './utils/exportAppliactionToCsv.ts'

const PAGE_SIZE = 10

function App() {
    const {t, i18n} = useTranslation()
    const statusLabels = useStatusLabels()

    const {
        applications,
        isLoading,
        loadError,

        searchInput,
        setSearchInput,
        activeStatuses,
        toggleStatusFilter,
        dateFrom,
        setDateFrom,
        dateTo,
        setDateTo,
        ordering,
        setOrdering,
        isFiltersOpen,
        setIsFiltersOpen,
        hasActiveFilters,
        handleResetFilters,
        statusCounts,

        page,
        setPage,
        pageCount,
        totalCount,

        createApplication,
        updateApplication,
        deleteApplication,
    } = useApplications()

    const form = useApplicationForm()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    const handleOpenCreateModal = () => {
        form.reset()
        setFormError(null)
        setIsModalOpen(true)
    }

    const handleOpenEditModal = (application: Application) => {
        form.loadApplication(application)
        setFormError(null)
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setFormError(null)
        form.reset()
    }

    const handleFormSubmit = async () => {
        setFormError(null)

        const payload = {
            company_name: form.values.company,
            description: form.values.description,
            url: form.values.jobUrl,
            notes: form.values.notes,
            applied_at: form.values.appliedAt,
            status: form.values.status,
        }

        try {
            if (form.isEditing && form.editingId !== null) {
                await updateApplication(form.editingId, payload)
            } else {
                await createApplication(payload)
            }

            handleCloseModal()
        } catch (error: unknown) {
            if (typeof error === 'object' && error !== null && !('message' in error)) {
                const apiErrors = error as Record<string, string[] | string>
                
                const firstKey = Object.keys(apiErrors)[0]
                const firstError = apiErrors[firstKey]

                if (Array.isArray(firstError)) {
                    setFormError(firstError[0])
                } else if (typeof firstError === 'string') {
                    setFormError(firstError)
                } else {
                    setFormError(t('errors.unexpected', 'Ein unerwarteter Fehler ist aufgetreten.'))
                }
            } 
            else if (error instanceof Error) {
                setFormError(error.message)
            } 
            else {
                setFormError(
                    t('errors.unexpected', 'Ein unerwarteter Fehler ist aufgetreten.')
                )
            }
        }
    }

    const handleExportPDF = () => {
        exportApplicationsToPDF(applications, {
            title: t('pdf.title'),
            subtitle: t('pdf.subtitle'),
            total: t('pdf.total'),
            pending: t('pdf.pending'),
            accepted: t('pdf.accepted'),
            rejected: t('pdf.rejected'),
            headers: {
                company: t('pdf.headers.company'),
                position: t('pdf.headers.position'),
                date: t('pdf.headers.date'),
                status: t('pdf.headers.status'),
            },
            statusLabels,
            pageOf: (page, pageCount) =>
                t('pdf.pageOf', {page, pageCount}),
            createdOn: (date) => t('pdf.createdOn', {date}),
            filename: t('pdf.filename'),
            locale: resolvePdfLocale(i18n.language),
        })
    }

    const handleExportCSV = () => {
        exportApplicationsToCSV(applications, {
            headers: {
                company: t('table.company'),
                position: t('table.position'),
                jobUrl: t('table.jobUrl'),
                notes: t('table.notes'),
                date: t('table.appliedAt'),
                status: t('table.status'),
            },
            statusLabels,
            locale: resolvePdfLocale(i18n.language),
            filename: t('csv.filename'),
        })
    }

    return (
        <main className={styles.app}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <div>
                        <h1 className={styles.title}>
                            {t('app.title')}
                        </h1>

                        <p className={styles.subtitle}>
                            {t('app.subtitle')}
                        </p>
                    </div>

                    <div className={styles.headerActions}>
                        <LanguageSwitcher/>
                        <ThemeToggle/>

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
                            {t('actions.exportPdf')}
                        </button>

                        <button
                            className={styles.exportButton}
                            onClick={handleExportCSV}
                            disabled={
                                applications.length === 0 ||
                                isLoading
                            }
                            type="button"
                        >
                            <span>↓</span>
                            {t('actions.exportCsv')}
                        </button>

                        <button
                            className={styles.createButton}
                            onClick={handleOpenCreateModal}
                            type="button"
                        >
                            <span>+</span>
                            {t('actions.addApplication')}
                        </button>
                    </div>
                </header>

                <FiltersBar
                    searchInput={searchInput}
                    onSearchInputChange={setSearchInput}
                    activeStatuses={activeStatuses}
                    onToggleStatus={toggleStatusFilter}
                    statusCounts={statusCounts}
                    isFiltersOpen={isFiltersOpen}
                    onToggleFiltersOpen={() =>
                        setIsFiltersOpen((prev) => !prev)
                    }
                    hasActiveFilters={hasActiveFilters}
                    onResetFilters={handleResetFilters}
                    dateFrom={dateFrom}
                    onDateFromChange={setDateFrom}
                    dateTo={dateTo}
                    onDateToChange={setDateTo}
                    ordering={ordering}
                    onOrderingChange={setOrdering}
                />

                <ApplicationsTable
                    applications={applications}
                    isLoading={isLoading}
                    loadError={loadError}
                    hasActiveFilters={hasActiveFilters}
                    onEdit={handleOpenEditModal}
                    onDelete={deleteApplication}
                />

                {!isLoading &&
                    !loadError &&
                    totalCount > PAGE_SIZE && (
                        <Pagination
                            page={page}
                            pageCount={pageCount}
                            onPageChange={setPage}
                        />
                    )}
            </div>

            <ApplicationModal
                isOpen={isModalOpen}
                form={form}
                error={formError}
                onClose={handleCloseModal}
                onSubmit={handleFormSubmit}
            />
        </main>
    )
}

export default App
