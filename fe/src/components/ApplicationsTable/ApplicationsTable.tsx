import {useTranslation} from 'react-i18next'
import styles from '../../App.module.scss'
import type {Application} from '../../types/application.ts'
import {useStatusLabels} from '../../hooks/useStatusLabel.ts'

interface ApplicationsTableProps {
    applications: Application[]
    isLoading: boolean
    loadError: boolean
    hasActiveFilters: boolean
    onEdit: (application: Application) => void
    onDelete: (id: number) => void
}

const SKELETON_ROWS = 5

function ApplicationsTable({
    applications,
    isLoading,
    loadError,
    hasActiveFilters,
    onEdit,
    onDelete,
}: ApplicationsTableProps) {
    const {t, i18n} = useTranslation()
    const statusLabels = useStatusLabels()

    return (
        <div className={styles.tableWrapper}>
            <table className={styles.table}>
                <thead>
                <tr>
                    <th>{t('table.company')}</th>
                    <th>{t('table.position')}</th>
                    <th>{t('table.jobUrl')}</th>
                    <th>{t('table.notes')}</th>
                    <th>{t('table.appliedAt')}</th>
                    <th>{t('table.status')}</th>
                    <th className={styles.actionsHead}/>
                </tr>
                </thead>
                <tbody>
                {isLoading ? (
                    Array.from({length: SKELETON_ROWS}).map((_, index) => (
                        <tr key={`skeleton-${index}`}>
                            <td>
                                <span className={`${styles.skeleton} ${styles.skeletonCompany}`}/>
                            </td>
                            <td>
                                <span className={`${styles.skeleton} ${styles.skeletonText}`}/>
                            </td>
                            <td>
                                <span className={`${styles.skeleton} ${styles.skeletonShort}`}/>
                            </td>
                            <td>
                                <span className={`${styles.skeleton} ${styles.skeletonText}`}/>
                            </td>
                            <td>
                                <span className={`${styles.skeleton} ${styles.skeletonShort}`}/>
                            </td>
                            <td>
                                <span className={`${styles.skeleton} ${styles.skeletonPill}`}/>
                            </td>
                            <td className={styles.actions}>
                                <span className={`${styles.skeleton} ${styles.skeletonIcon}`}/>
                                <span className={`${styles.skeleton} ${styles.skeletonIcon}`}/>
                            </td>
                        </tr>
                    ))
                ) : loadError ? (
                    <tr>
                        <td className={styles.empty} colSpan={7}>
                            {t('table.loadError')}
                            <br/>
                            {t('table.loadErrorRetry')}
                        </td>
                    </tr>
                ) : applications.length !== 0 ? (
                    applications.map((application) => (
                        <tr key={application.id}>
                            <td className={styles.company}>
                                {application.company_name}
                            </td>

                            <td>{application.description}</td>

                            <td className={styles.date}>
                                {application.url ? (
                                    <a
                                        href={application.url}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        {t('table.viewJob')}
                                    </a>
                                ) : (
                                    '—'
                                )}
                            </td>

                            <td className={styles.date}>
                                {application.notes || '—'}
                            </td>

                            <td className={styles.date}>
                                {application.applied_at
                                    ? new Date(
                                          application.applied_at
                                      ).toLocaleDateString(i18n.language)
                                    : '—'}
                            </td>

                            <td>
                                <span
                                    className={`${styles.status} ${
                                        application.status === 'accepted'
                                            ? styles.success
                                            : application.status ===
                                                'rejected'
                                              ? styles.rejected
                                              : styles.pending
                                    }`}
                                >
                                    {statusLabels[application.status]}
                                </span>
                            </td>

                            <td className={styles.actions}>
                                <button
                                    className={styles.editButton}
                                    onClick={() => onEdit(application)}
                                    aria-label={t('actions.edit')}
                                    title={t('actions.edit')}
                                    type="button"
                                >
                                    ✎
                                </button>

                                <button
                                    className={styles.deleteButton}
                                    onClick={() => onDelete(application.id)}
                                    aria-label={t('actions.delete')}
                                    title={t('actions.delete')}
                                    type="button"
                                >
                                    ×
                                </button>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td className={styles.empty} colSpan={7}>
                            {hasActiveFilters
                                ? t('table.emptyFiltered')
                                : t('table.emptyDefault')}
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
        </div>
    )
}

export default ApplicationsTable