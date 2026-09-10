import {useState} from 'react'
import {useTranslation} from 'react-i18next'
import getTodayDateString from '../utils/getTodayDateString.ts'
import type {Application, ApplicationStatus} from '../types/application.ts'

export interface ApplicationFormValues {
    company: string
    description: string
    jobUrl: string
    notes: string
    appliedAt: string
    status: ApplicationStatus
}

export interface ApplicationFormErrors {
    company?: string
    description?: string
    appliedAt?: string
}

const getInitialValues = (): ApplicationFormValues => ({
    company: '',
    description: '',
    jobUrl: '',
    notes: '',
    appliedAt: getTodayDateString(),
    status: 'pending',
})

export function useApplicationForm() {
    const {t} = useTranslation()

    const [editingId, setEditingId] = useState<number | null>(null)
    const [values, setValues] = useState<ApplicationFormValues>(
        getInitialValues()
    )
    const [errors, setErrors] = useState<ApplicationFormErrors>({})

    const isEditing = editingId !== null

    const setField = <K extends keyof ApplicationFormValues>(
        field: K,
        value: ApplicationFormValues[K]
    ) => {
        setValues((prev) => ({...prev, [field]: value}))

        // Fehlermeldung verschwindet, sobald das Feld bearbeitet wird
        if ((errors as Record<string, string | undefined>)[field]) {
            setErrors((prev) => ({...prev, [field]: undefined}))
        }
    }

    const reset = () => {
        setValues(getInitialValues())
        setErrors({})
        setEditingId(null)
    }

    const loadApplication = (application: Application) => {
        setEditingId(application.id)
        setValues({
            company: application.company_name,
            description: application.description,
            jobUrl: application.url,
            notes: application.notes ?? '',
            appliedAt: application.applied_at
                ? application.applied_at.slice(0, 10)
                : getTodayDateString(),
            status: application.status,
        })
        setErrors({})
    }

    const validate = () => {
        const nextErrors: ApplicationFormErrors = {}

        if (!values.company.trim()) {
            nextErrors.company = t('form.companyError')
        }

        if (!values.description.trim()) {
            nextErrors.description = t('form.descriptionError')
        }

        if (!values.appliedAt) {
            nextErrors.appliedAt = t('form.appliedAtError')
        }

        setErrors(nextErrors)

        return Object.keys(nextErrors).length === 0
    }

    return {
        editingId,
        isEditing,
        values,
        errors,
        setField,
        reset,
        loadApplication,
        validate,
    }
}