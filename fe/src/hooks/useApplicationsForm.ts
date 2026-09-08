import {useState} from 'react'
import getTodayDateString from '../utils/getTodayDateString.ts'
import type {Application, ApplicationStatus} from '../types/application.ts'

export interface ApplicationFormValues {
    company: string
    description: string
    jobUrl: string
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
    appliedAt: getTodayDateString(),
    status: 'pending',
})

export function useApplicationForm() {
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
            appliedAt: application.applied_at.slice(0, 10),
            status: application.status,
        })
        setErrors({})
    }

    const validate = () => {
        const nextErrors: ApplicationFormErrors = {}

        if (!values.company.trim()) {
            nextErrors.company = 'Bitte geben Sie ein Unternehmen an'
        }

        if (!values.description.trim()) {
            nextErrors.description =
                'Bitte geben Sie eine Position/Beschreibung an'
        }

        if (!values.appliedAt) {
            nextErrors.appliedAt = 'Bitte wählen Sie ein Bewerbungsdatum'
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