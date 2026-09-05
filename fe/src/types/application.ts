export type ApplicationStatus = 'pending' | 'accepted' | 'rejected'

export type Application = {
    id: number
    company_name: string
    description: string
    applied_at: string
    status: ApplicationStatus
}