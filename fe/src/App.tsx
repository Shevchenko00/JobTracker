import {useState} from 'react'
import styles from './App.module.scss'
import {useApplications} from './hooks/useApplications.ts'
import {useApplicationForm} from './hooks/useApplicationsForm.ts'
import {exportApplicationsToPDF} from './utils/exportApplicationsToPDF.ts'
import FilterBar from './components/FilterBar/FilterBar.tsx'
import ApplicationsTable from './components/ApplicationsTable/ApplicationsTable.tsx'
import Pagination from './components/Pagination/Pagination.tsx'
import ApplicationModal from './components/ApplicationsModal/ApplicationsModal.tsx'
import type {Application} from './types/application.ts'

const PAGE_SIZE = 10

function App() {
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

    const handleOpenCreateModal = () => {
        form.reset()
        setIsModalOpen(true)
    }

    const handleOpenEditModal = (application: Application) => {
        form.loadApplication(application)
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        form.reset()
    }

    const handleFormSubmit = async () => {
        const payload = {
            company_name: form.values.company,
            description: form.values.description,
            url: form.values.jobUrl,
            applied_at: form.values.appliedAt,
            status: form.values.status,
        }

        if (form.isEditing && form.editingId !== null) {
            await updateApplication(form.editingId, payload)
        } else {
            await createApplication(payload)
        }

        handleCloseModal()
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
                            onClick={() =>
                                exportApplicationsToPDF(applications)
                            }
                            disabled={
                                applications.length === 0 || isLoading
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

                <FilterBar
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

                {!isLoading && !loadError && totalCount > PAGE_SIZE && (
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
                onClose={handleCloseModal}
                onSubmit={handleFormSubmit}
            />
        </main>
    )
}

export default App