import {useTranslation} from 'react-i18next'
import type {Ordering} from '../types/ordering.ts'

// ACHTUNG: Diese Werte sind eine Annahme, da mir der Inhalt von
// types/ordering.ts nicht vorliegt. Bitte mit dem echten Ordering-Typ
// abgleichen und ggf. anpassen.
export const orderingValues: Ordering[] = [
    '-applied_at',
    'applied_at',
    '-company_name',
    'company_name',
]

export function useOrderingLabels(): Record<Ordering, string> {
    const {t} = useTranslation()

    return orderingValues.reduce(
        (acc, value) => {
            acc[value] = t(`ordering.${value}`)
            return acc
        },
        {} as Record<Ordering, string>
    )
}