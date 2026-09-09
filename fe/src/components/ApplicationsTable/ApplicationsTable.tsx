import styles from '../../App.module.scss'
import type {Application} from '../../types/application.ts'
import {statusLabels} from '../../types/status.ts'

interface ApplicationsTableProps {
    applications: Application[]
    isLoading: boolean
    loadError: boolean
    hasActiveFilters: boolean
    onEdit: (application: Application) => void
    onDelete: (id: number) => void
}

function ApplicationsTable({
    applications,
    isLoading,
    loadError,
    hasActiveFilters,
    onEdit,
    onDelete,
}: ApplicationsTableProps) {
    return (
        <div className={styles.tableWrapper}>
            <table className={styles.table}>
                <thead>
                <tr>
                    <th>Unternehmen</th>
                    <th>Position / Beschreibung</th>
                    <th>Job URL</th>
                    <th>Notizen</th>
                    <th>Bewerbungsdatum</th>
                    <th>Status</th>
                    <th className={styles.actionsHead}/>
                </tr>
                </thead>
                <tbody>
                {isLoading ? (
                    <tr>
                        <td className={styles.empty} colSpan={7}>
                            Bewerbungen werden geladen...
                        </td>
                    </tr>
                ) : loadError ? (
                    <tr>
                        <td className={styles.empty} colSpan={7}>
                            Bewerbungen konnten nicht geladen werden.
                            <br/>
                            Bitte versuchen Sie es erneut.
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
                                        Zur Anzeige
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
                                      ).toLocaleDateString('de-DE')
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
                                    aria-label="Bewerbung bearbeiten"
                                    title="Bewerbung bearbeiten"
                                    type="button"
                                >
                                    ✎
                                </button>

                                <button
                                    className={styles.deleteButton}
                                    onClick={() => onDelete(application.id)}
                                    aria-label="Bewerbung löschen"
                                    title="Bewerbung löschen"
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
                                ? 'Für die gewählten Filter wurde nichts gefunden'
                                : 'Noch keine Bewerbungen vorhanden'}
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
        </div>
    )
}

export default ApplicationsTable