import styles from '../../App.module.scss'
import {statusLabels, statusOrder} from '../../types/status.ts'
import {orderingLabels} from '../../types/ordering.ts'
import type {ApplicationStatus} from '../../types/application.ts'
import type {Ordering} from '../../types/ordering.ts'

interface FiltersBarProps {
    searchInput: string
    onSearchInputChange: (value: string) => void

    activeStatuses: ApplicationStatus[]
    onToggleStatus: (status: ApplicationStatus) => void
    statusCounts: Record<ApplicationStatus, number>

    isFiltersOpen: boolean
    onToggleFiltersOpen: () => void

    hasActiveFilters: boolean
    onResetFilters: () => void

    dateFrom: string
    onDateFromChange: (value: string) => void
    dateTo: string
    onDateToChange: (value: string) => void

    ordering: Ordering
    onOrderingChange: (value: Ordering) => void
}

function FiltersBar({
    searchInput,
    onSearchInputChange,
    activeStatuses,
    onToggleStatus,
    statusCounts,
    isFiltersOpen,
    onToggleFiltersOpen,
    hasActiveFilters,
    onResetFilters,
    dateFrom,
    onDateFromChange,
    dateTo,
    onDateToChange,
    ordering,
    onOrderingChange,
}: FiltersBarProps) {
    return (
        <>
            <section className={styles.filtersBar}>
                <div className={styles.searchField}>
                    <span className={styles.searchIcon}>⚲</span>

                    <input
                        type="text"
                        placeholder="Suche nach Unternehmen oder Position..."
                        value={searchInput}
                        onChange={(event) =>
                            onSearchInputChange(event.target.value)
                        }
                    />

                    {searchInput && (
                        <button
                            type="button"
                            className={styles.clearSearch}
                            onClick={() => onSearchInputChange('')}
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
                            onClick={() => onToggleStatus(status)}
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
                    onClick={onToggleFiltersOpen}
                >
                    Datum & Sortierung {isFiltersOpen ? '▲' : '▼'}
                </button>

                {hasActiveFilters && (
                    <button
                        type="button"
                        className={styles.resetFiltersButton}
                        onClick={onResetFilters}
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
                                onDateFromChange(event.target.value)
                            }
                        />
                    </label>

                    <label>
                        Datum bis

                        <input
                            type="date"
                            value={dateTo}
                            onChange={(event) =>
                                onDateToChange(event.target.value)
                            }
                        />
                    </label>

                    <label>
                        Sortierung

                        <select
                            value={ordering}
                            onChange={(event) =>
                                onOrderingChange(
                                    event.target.value as Ordering
                                )
                            }
                        >
                            {Object.entries(orderingLabels).map(
                                ([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                )
                            )}
                        </select>
                    </label>
                </section>
            )}
        </>
    )
}

export default FiltersBar