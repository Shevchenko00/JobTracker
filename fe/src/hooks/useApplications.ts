import { useEffect, useMemo, useState } from 'react'
import type { Application, ApplicationStatus } from '../types/application.ts'
import type { Ordering } from '../types/ordering.ts'
import type { PaginatedResponse } from '../types/pagination.ts'

const API_BASE = import.meta.env.VITE_API_URL
const PAGE_SIZE = 10

export interface ApplicationPayload {
    company_name: string
    description: string
    notes: string
    url: string
    applied_at: string
    status: ApplicationStatus
}

const getLanguage = (): string => {
    const language = localStorage.getItem('language')

    if (language === 'uk' || language === 'de' || language === 'en') {
        return language
    }

    return 'de'
}

const apiFetch = (
    url: string,
    options: RequestInit = {}
): Promise<Response> => {
    const language = getLanguage()

    const headers = new Headers(options.headers || {})
    headers.set('Accept-Language', language)

    return fetch(url, {
        ...options,
        headers,
    })
}

export function useApplications() {
    const [applications, setApplications] = useState<Application[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState(false)

    // --- Filter ---
    const [searchInput, setSearchInput] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [activeStatuses, setActiveStatuses] = useState<
        ApplicationStatus[]
    >([])
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [ordering, setOrdering] = useState<Ordering>('-applied_at')
    const [isFiltersOpen, setIsFiltersOpen] = useState(false)

    // --- Pagination ---
    const [page, setPage] = useState(1)
    const [totalCount, setTotalCount] = useState(0)

    const pageCount = Math.max(
        1,
        Math.ceil(totalCount / PAGE_SIZE)
    )

    const hasActiveFilters =
        searchQuery.trim() !== '' ||
        activeStatuses.length > 0 ||
        dateFrom !== '' ||
        dateTo !== ''

    // --- Search debounce ---
    useEffect(() => {
        const timeout = setTimeout(() => {
            setSearchQuery(searchInput.trim())
        }, 350)

        return () => clearTimeout(timeout)
    }, [searchInput])

    // --- Reset page when filters change ---
    useEffect(() => {
        setPage(1)
    }, [
        searchQuery,
        activeStatuses,
        dateFrom,
        dateTo,
        ordering,
    ])

    const buildQueryString = (targetPage: number) => {
        const params = new URLSearchParams()

        if (searchQuery) {
            params.set('search', searchQuery)
        }

        if (activeStatuses.length > 0) {
            params.set(
                'status',
                activeStatuses.join(',')
            )
        }

        if (dateFrom) {
            params.set('date_from', dateFrom)
        }

        if (dateTo) {
            params.set('date_to', dateTo)
        }

        if (ordering) {
            params.set('ordering', ordering)
        }

        if (targetPage > 1) {
            params.set('page', String(targetPage))
        }

        const query = params.toString()

        return query ? `?${query}` : ''
    }

    const fetchApplications = async (
        targetPage: number = page
    ) => {
        setIsLoading(true)
        setLoadError(false)

        try {
            const response = await apiFetch(
                `${API_BASE}/${buildQueryString(targetPage)}`
            )

            if (!response.ok) {
                throw new Error(
                    `Fehler beim Laden der Bewerbungen: ${response.status}`
                )
            }

            const data: PaginatedResponse<Application> =
                await response.json()

            setApplications(data.results)
            setTotalCount(data.count)
        } catch (error) {
            console.error(
                'Fehler beim Laden der Bewerbungen:',
                error
            )

            setLoadError(true)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchApplications(page)

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        searchQuery,
        activeStatuses,
        dateFrom,
        dateTo,
        ordering,
        page,
    ])

    // --- Filters ---

    const toggleStatusFilter = (
        status: ApplicationStatus
    ) => {
        setActiveStatuses((prev) =>
            prev.includes(status)
                ? prev.filter(
                      (item) => item !== status
                  )
                : [...prev, status]
        )
    }

    const handleResetFilters = () => {
        setSearchInput('')
        setSearchQuery('')
        setActiveStatuses([])
        setDateFrom('')
        setDateTo('')
        setOrdering('-applied_at')
    }

    // --- Status counts ---

    const statusCounts = useMemo(() => {
        return applications.reduce(
            (acc, application) => {
                acc[application.status] += 1

                return acc
            },
            {
                pending: 0,
                accepted: 0,
                rejected: 0,
            } as Record<
                ApplicationStatus,
                number
            >
        )
    }, [applications])

    // --- Create ---

    const createApplication = async (
        payload: ApplicationPayload
    ) => {
        const response = await apiFetch(
            `${API_BASE}/create/`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            }
        )

        if (!response.ok) {
            const data = await response.json()

            throw data
        }

        if (page === 1) {
            await fetchApplications(1)
        } else {
            setPage(1)
        }
    }

    // --- Update ---

    const updateApplication = async (
        id: number,
        payload: ApplicationPayload
    ) => {
        const response = await apiFetch(
            `${API_BASE}/update/${id}/`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            }
        )

        if (!response.ok) {
            const data = await response.json()

            throw data
        }

        await fetchApplications(page)
    }

    // --- Delete ---

    const deleteApplication = async (
        id: number
    ) => {
        try {
            const response = await apiFetch(
                `${API_BASE}/delete/${id}/`,
                {
                    method: 'DELETE',
                }
            )

            if (!response.ok) {
                throw new Error(
                    `Fehler beim Löschen der Bewerbung: ${response.status}`
                )
            }

            const isLastItemOnPage =
                applications.length === 1

            const targetPage =
                isLastItemOnPage && page > 1
                    ? page - 1
                    : page

            if (targetPage !== page) {
                setPage(targetPage)
            } else {
                await fetchApplications(
                    targetPage
                )
            }
        } catch (error) {
            console.error(
                'Fehler beim Löschen der Bewerbung:',
                error
            )
        }
    }

    return {
        applications,
        isLoading,
        loadError,

        searchInput,
        setSearchInput,

        activeStatuses,
        toggleStatusFilter,

        dateFrom,
        setDateFrom,

        dateTo,
        setDateTo,

        ordering,
        setOrdering,

        isFiltersOpen,
        setIsFiltersOpen,

        hasActiveFilters,
        handleResetFilters,
        statusCounts,

        page,
        setPage,
        pageCount,
        totalCount,

        createApplication,
        updateApplication,
        deleteApplication,
    }
}