import type {FormEvent} from 'react'
import {useTranslation} from 'react-i18next'
import styles from '../../App.module.scss'
import type {ApplicationStatus} from '../../types/application.ts'
import type {useApplicationForm} from '../../hooks/useApplicationForm.ts'

interface ApplicationModalProps {
    isOpen: boolean
    form: ReturnType<typeof useApplicationForm>
    error: string | null
    onClose: () => void
    onSubmit: () => void | Promise<void>
}

function ApplicationModal({
    isOpen,
    form,
    error,
    onClose,
    onSubmit,
}: ApplicationModalProps) {
    const {t} = useTranslation()

    if (!isOpen) {
        return null
    }

    const {
        isEditing,
        values,
        errors,
        setField,
        validate,
    } = form

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
                                ? t('form.editTitle')
                                : t('form.createTitle')}
                        </h2>

                        <p>
                            {isEditing
                                ? t('form.editSubtitle')
                                : t('form.createSubtitle')}
                        </p>
                    </div>

                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                        aria-label={t('actions.close')}
                        title={t('actions.close')}
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
                        {t('form.company')} *

                        <input
                            type="text"
                            placeholder={t('form.companyPlaceholder')}
                            value={values.company}
                            className={
                                errors.company
                                    ? styles.inputError
                                    : ''
                            }
                            onChange={(event) =>
                                setField(
                                    'company',
                                    event.target.value
                                )
                            }
                        />

                        {errors.company && (
                            <span className={styles.fieldError}>
                                {errors.company}
                            </span>
                        )}
                    </label>

                    <label>
                        {t('form.description')} *

                        <input
                            type="text"
                            placeholder={t(
                                'form.descriptionPlaceholder'
                            )}
                            value={values.description}
                            className={
                                errors.description
                                    ? styles.inputError
                                    : ''
                            }
                            onChange={(event) =>
                                setField(
                                    'description',
                                    event.target.value
                                )
                            }
                        />

                        {errors.description && (
                            <span className={styles.fieldError}>
                                {errors.description}
                            </span>
                        )}
                    </label>

                    <label>
                        {t('form.jobUrl')}

                        <input
                            type="text"
                            placeholder={t(
                                'form.jobUrlPlaceholder'
                            )}
                            value={values.jobUrl}
                            onChange={(event) =>
                                setField(
                                    'jobUrl',
                                    event.target.value
                                )
                            }
                        />
                    </label>

                    <label>
                        {t('form.notes')}

                        <input
                            type="text"
                            placeholder={t(
                                'form.notesPlaceholder'
                            )}
                            value={values.notes}
                            onChange={(event) =>
                                setField(
                                    'notes',
                                    event.target.value
                                )
                            }
                        />
                    </label>

                    <label>
                        {t('form.appliedAt')} *

                        <input
                            type="date"
                            value={values.appliedAt}
                            className={
                                errors.appliedAt
                                    ? styles.inputError
                                    : ''
                            }
                            onChange={(event) =>
                                setField(
                                    'appliedAt',
                                    event.target.value
                                )
                            }
                        />

                        {errors.appliedAt && (
                            <span className={styles.fieldError}>
                                {errors.appliedAt}
                            </span>
                        )}
                    </label>

                    <label>
                        {t('form.status')} *

                        <select
                            value={values.status}
                            onChange={(event) =>
                                setField(
                                    'status',
                                    event.target
                                        .value as ApplicationStatus
                                )
                            }
                        >
                            <option value="pending">
                                {t('status.pending')}
                            </option>

                            <option value="accepted">
                                {t('status.accepted')}
                            </option>

                            <option value="rejected">
                                {t('status.rejected')}
                            </option>
                        </select>
                    </label>

                    {error && (
                        <div
                            className={styles.formError}
                            role="alert"
                        >
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className={styles.submitButton}
                    >
                        {isEditing
                            ? t('form.submitEdit')
                            : t('form.submitCreate')}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default ApplicationModal
