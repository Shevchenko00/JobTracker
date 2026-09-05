import type {ApplicationStatus} from "./application.ts";

export const statusLabels: Record<ApplicationStatus, string> = {
    pending: 'In Bearbeitung',
    accepted: 'Einladung',
    rejected: 'Absage',
}

export const statusOrder: ApplicationStatus[] = ['pending', 'accepted', 'rejected']