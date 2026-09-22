import {useTranslation} from 'react-i18next'
import styles from './FilterBar.module.scss'
import {useStatusLabels} from '../../hooks/useStatusLabel.ts'
import {useOrderingLabels, orderingValues} from '../../hooks/useOrderingLabels.ts'
import {statusOrder} from '../../types/status.ts'
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
    const {t} = useTranslation()
    const statusLabels = useStatusLabels()
    const orderingLabels = useOrderingLabels()

    const activeStatusSet = new Set(activeStatuses)

    return (
        <>
            <section className={styles.filtersBar}>
                <div className={styles.searchField}>
                    <span className={styles.searchIcon}>⚲</span>

                    <input
                        type="text"
                        placeholder={t('filters.searchPlaceholder')}
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
                            aria-label={t('filters.clearSearch')}
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
    activeStatusSet.has(status)
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
                    {t('filters.toggle')} {isFiltersOpen ? '▲' : '▼'}
                </button>

                {hasActiveFilters && (
                    <button
                        type="button"
                        className={styles.resetFiltersButton}
                        onClick={onResetFilters}
                    >
                        {t('filters.reset')}
                    </button>
                )}
            </section>

            {isFiltersOpen && (
                <section className={styles.filtersExpanded}>
                    <label>
                        {t('filters.dateFrom')}

                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(event) =>
                                onDateFromChange(event.target.value)
                            }
                        />
                    </label>

                    <label>
                        {t('filters.dateTo')}

                        <input
                            type="date"
                            value={dateTo}
                            onChange={(event) =>
                                onDateToChange(event.target.value)
                            }
                        />
                    </label>

                    <label>
                        {t('filters.sorting')}

                        <select
                            value={ordering}
                            onChange={(event) =>
                                onOrderingChange(
                                    event.target.value as Ordering
                                )
                            }
                        >
                            {orderingValues.map((value) => (
                                <option key={value} value={value}>
                                    {orderingLabels[value]}
                                </option>
                            ))}
                        </select>
                    </label>
                </section>
            )}
        </>
    )
}

export default FiltersBar
