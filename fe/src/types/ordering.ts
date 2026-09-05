export type Ordering = 'applied_at' | '-applied_at' | 'company_name' | '-company_name'




export const orderingLabels: Record<Ordering, string> = {
    '-applied_at': 'Neueste zuerst',
    applied_at: 'Älteste zuerst',
    company_name: 'Unternehmen A-Z',
    '-company_name': 'Unternehmen Z-A',
}
