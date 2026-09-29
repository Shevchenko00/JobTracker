import {useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {
    parseApplicationsCSV,
    commitParsedRows,
} from '@/utils/importApplicationsFromCsv.ts'
import type {ImportApplication, ParseResult} from '@/utils/importApplicationsFromCsv.ts'
import styles from './ImportPreviewModal.module.scss'

type Props = {
    isOpen: boolean
    onClose: () => void
    onImport: (applications: ImportApplication[]) => Promise<void>
}

const FIELD_LABEL_KEYS: Record<string, string> = {
    company_name: 'table.company',
    description: 'table.position',
    url: 'table.jobUrl',
    notes: 'table.notes',
    applied_at: 'table.appliedAt',
    status: 'table.status',
}

export const ImportPreviewModal = ({isOpen, onClose, onImport}: Props) => {
    const {t} = useTranslation()
    const [result, setResult] = useState<ParseResult | null>(null)
    const [excluded, setExcluded] = useState<Set<number>>(new Set())
    const [isImporting, setIsImporting] = useState(false)
    const [importError, setImportError] = useState<string | null>(null)

    const fieldLabel = (field: string) =>
        FIELD_LABEL_KEYS[field] ? t(FIELD_LABEL_KEYS[field]) : field

    const handleFileSelected = async (file: File) => {
        setImportError(null)
        const parsed = await parseApplicationsCSV(file)
        setResult(parsed)
        setExcluded(new Set())
    }

    const includedRowNumbers = useMemo(() => {
        if (!result) return new Set<number>()
        return new Set(
            result.rows
                .filter((row) => row.errors.length === 0 && !excluded.has(row.rowNumber))
                .map((row) => row.rowNumber),
        )
    }, [result, excluded])

    if (!isOpen) return null

    const toggleRow = (rowNumber: number) => {
        setExcluded((prev) => {
            const next = new Set(prev)
            if (next.has(rowNumber)) next.delete(rowNumber)
            else next.add(rowNumber)
            return next
        })
    }

    const handleReset = () => {
        setResult(null)
        setExcluded(new Set())
        setImportError(null)
    }

    const handleCloseModal = () => {
        if (isImporting) return
        handleReset()
        onClose()
    }

    const handleConfirm = async () => {
        if (!result) return
        const applications = commitParsedRows(result, includedRowNumbers)

        setIsImporting(true)
        setImportError(null)
        try {
            await onImport(applications)
            handleReset()
            onClose()
        } catch (error: unknown) {
            setImportError(
                error instanceof Error
                    ? error.message
                    : t('errors.csvImport'),
            )
        } finally {
            setIsImporting(false)
        }
    }

    const hasMissingColumns = !!result && result.missingRequiredColumns.length > 0
    const isPreviewReady = !!result && result.missingRequiredColumns.length === 0
    const validCount = result ? result.rows.filter((r) => r.errors.length === 0).length : 0
    const errorCount = result ? result.rows.filter((r) => r.errors.length > 0).length : 0

    return (
        <div className={styles.overlay} onClick={handleCloseModal}>
            <div
                className={styles.panel}
                role="dialog"
                aria-modal="true"
                aria-labelledby="import-modal-title"
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.header}>
                    <h2 id="import-modal-title" className={styles.title}>
                        {t('actions.importCsv')}
                    </h2>
                    <button
                        className={styles.closeButton}
                        onClick={handleCloseModal}
                        disabled={isImporting}
                        aria-label={t('actions.close')}
                    >
                        ×
                    </button>
                </div>

                <div className={styles.body}>
                    {!result && (
                        <label className={styles.dropzone}>
                            <span className={styles.dropzoneTitle}>{t('importModal.dropzoneTitle')}</span>
                            <span className={styles.dropzoneHint}>
                                {t('importModal.dropzoneHint')}
                            </span>
                            <input
                                className={styles.fileInput}
                                type="file"
                                accept=".csv,text/csv"
                                onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) handleFileSelected(file)
                                }}
                            />
                        </label>
                    )}

                    {hasMissingColumns && result && (
                        <div className={styles.errorBox}>
                            <p>{t('importModal.missingColumns')}</p>
                            <ul>
                                {result.missingRequiredColumns.map((field) => (
                                    <li key={field}>{fieldLabel(field)}</li>
                                ))}
                            </ul>
                            <button className={styles.secondaryButton} onClick={handleReset}>
                                {t('importModal.chooseAnotherFile')}
                            </button>
                        </div>
                    )}

                    {isPreviewReady && result && (
                        <>
                            <h3 className={styles.sectionTitle}>{t('importModal.foundColumns')}</h3>
                            <ul className={styles.mappingList}>
                                {Object.entries(result.columnMapping).map(([field, header]) => (
                                    <li key={field} className={styles.mappingItem}>
                                        <span className={styles.mappingField}>{fieldLabel(field)}</span>
                                        <span className={styles.mappingHeader}>→ "{header}"</span>
                                    </li>
                                ))}
                            </ul>

                            <p className={styles.summary}>
                                <span>
                                    {t('importModal.validRows')}: <strong>{validCount}</strong>
                                </span>
                                <span className={errorCount > 0 ? styles.summaryError : undefined}>
                                    {t('importModal.rowsWithErrors')}: <strong>{errorCount}</strong>
                                </span>
                                <span>
                                    {t('importModal.willImport')}: <strong>{includedRowNumbers.size}</strong>
                                </span>
                            </p>

                            <div className={styles.tableWrap}>
                                <table className={styles.table}>
                                    <thead>
                                    <tr>
                                        <th className={styles.colCheck}></th>
                                        <th className={styles.colNumber}>#</th>
                                        <th>{t('table.company')}</th>
                                        <th>{t('table.status')}</th>
                                        <th>{t('table.appliedAt')}</th>
                                        <th>{t('importModal.errors')}</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {result.rows.map((row) => {
                                        const hasErrors = row.errors.length > 0
                                        return (
                                            <tr
                                                key={row.rowNumber}
                                                className={hasErrors ? styles.rowInvalid : undefined}
                                            >
                                                <td>
                                                    <input
                                                        className={styles.checkbox}
                                                        type="checkbox"
                                                        disabled={hasErrors}
                                                        checked={
                                                            !hasErrors &&
                                                            includedRowNumbers.has(row.rowNumber)
                                                        }
                                                        onChange={() => toggleRow(row.rowNumber)}
                                                    />
                                                </td>
                                                <td className={styles.colNumber}>{row.rowNumber}</td>
                                                <td>{row.data.company_name ?? '—'}</td>
                                                <td>
                                                    {row.data.status
                                                        ? t(`status.${row.data.status}`, {defaultValue: row.data.status})
                                                        : '—'}
                                                </td>
                                                <td>{row.data.applied_at ?? '—'}</td>
                                                <td className={styles.cellError}>
                                                    {row.errors.join(' ')}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    </tbody>
                                </table>
                            </div>

                            {importError && (
                                <p role="alert" className={styles.importError}>
                                    {importError}
                                </p>
                            )}
                        </>
                    )}
                </div>

                {isPreviewReady && (
                    <div className={styles.footer}>
                        <button
                            className={styles.secondaryButton}
                            onClick={handleReset}
                            disabled={isImporting}
                        >
                            {t('importModal.anotherFile')}
                        </button>
                        <button
                            className={styles.primaryButton}
                            onClick={handleConfirm}
                            disabled={includedRowNumbers.size === 0 || isImporting}
                        >
                            {isImporting
                                ? t('actions.importingCsv')
                                : t('importModal.import', {count: includedRowNumbers.size})}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}