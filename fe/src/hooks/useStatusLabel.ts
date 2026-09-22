import {useTranslation} from 'react-i18next'
import type {ApplicationStatus} from '@/types/application.ts'

export function useStatusLabels(): Record<ApplicationStatus, string> {
    const {t} = useTranslation()

    return {
        pending: t('status.pending'),
        accepted: t('status.accepted'),
        rejected: t('status.rejected'),
    }
}