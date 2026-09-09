import type {FormEvent} from 'react'
import styles from '../../App.module.scss'
import type {ApplicationStatus} from '../../types/application.ts'
import type {useApplicationForm} from '../../hooks/useApplicationsForm.ts'

interface ApplicationModalProps {
    isOpen: boolean
    form: ReturnType<typeof useApplicationForm>
    onClose: () => void
    onSubmit: () => void
}

function ApplicationModal({
    isOpen,
    form,
    onClose,
    onSubmit,
}: ApplicationModalProps) {
    if (!isOpen) {
        return null
    }

    const {isEditing, values, errors, setField, validate} = form

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault()

        if (!validate()) {
            return
        }

        onSubmit()
    }

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div
                className={styles.modal}
                onClick={(event) => event.stopPropagation()}
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
                        onClick={onClose}
                        aria-label="Schließen"
                        title="Schließen"
                        type="button"
                    >
                        ×
                    </button>
                </div>

                <form
                    className={styles.form}
                    onSubmit={handleSubmit}
                    noValidate
                >
                    <label>
                        Unternehmen *

                        <input
                            type="text"
                            placeholder="Zum Beispiel Google"
                            value={values.company}
                            className={
                                errors.company ? styles.inputError : ''
                            }
                            onChange={(event) =>
                                setField('company', event.target.value)
                            }
                        />

                        {errors.company && (
                            <span className={styles.fieldError}>
                                {errors.company}
                            </span>
                        )}
                    </label>

                    <label>
                        Position / Beschreibung *

                        <input
                            type="text"
                            placeholder="Zum Beispiel Frontend Developer"
                            value={values.description}
                            className={
                                errors.description ? styles.inputError : ''
                            }
                            onChange={(event) =>
                                setField('description', event.target.value)
                            }
                        />

                        {errors.description && (
                            <span className={styles.fieldError}>
                                {errors.description}
                            </span>
                        )}
                    </label>

                    <label>
                        Job URL

                        <input
                            type="text"
                            placeholder="Zum Beispiel https://www.example.com/job"
                            value={values.jobUrl}
                            onChange={(event) =>
                                setField('jobUrl', event.target.value)
                            }
                        />
                    </label>
                    
                    <label>
                        Notizen

                        <input
                            type="text"
                            placeholder="Zum Beispiel..."
                            value={values.notes}
                            onChange={(event) =>
                                setField('notes', event.target.value)
                            }
                        />
                    </label>

                    <label>
                        Bewerbungsdatum *

                        <input
                            type="date"
                            value={values.appliedAt}
                            className={
                                errors.appliedAt ? styles.inputError : ''
                            }
                            onChange={(event) =>
                                setField('appliedAt', event.target.value)
                            }
                        />

                        {errors.appliedAt && (
                            <span className={styles.fieldError}>
                                {errors.appliedAt}
                            </span>
                        )}
                    </label>

                    <label>
                        Status *

                        <select
                            value={values.status}
                            onChange={(event) =>
                                setField(
                                    'status',
                                    event.target.value as ApplicationStatus
                                )
                            }
                        >
                            <option value="pending">In Bearbeitung</option>
                            <option value="accepted">Einladung</option>
                            <option value="rejected">Absage</option>
                        </select>
                    </label>

                    <button type="submit" className={styles.submitButton}>
                        {isEditing
                            ? 'Änderungen speichern'
                            : 'Bewerbung erstellen'}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default ApplicationModal