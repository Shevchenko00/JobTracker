import {useMemo, useState} from 'react'
import {
    parseApplicationsCSV,
    commitParsedRows,
} from '../../utils/importApplicationsFromCsv.ts'
import type {ImportApplication, ParseResult} from '../../utils/importApplicationsFromCsv.ts'

type Props = {
    isOpen: boolean
    onClose: () => void
    /** Вызывается по нажатию "Импортировать" с готовым списком заявок. */
    onImport: (applications: ImportApplication[]) => Promise<void>
}

const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
}

const panelStyle: React.CSSProperties = {
    background: 'var(--modal-bg, #fff)',
    color: 'var(--modal-fg, #111)',
    borderRadius: 8,
    padding: 24,
    maxWidth: 720,
    width: '90%',
    maxHeight: '85vh',
    overflowY: 'auto',
}

export const ImportPreviewModal = ({isOpen, onClose, onImport}: Props) => {
    const [result, setResult] = useState<ParseResult | null>(null)
    const [excluded, setExcluded] = useState<Set<number>>(new Set())
    const [isImporting, setIsImporting] = useState(false)
    const [importError, setImportError] = useState<string | null>(null)

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
                    : 'Fehler beim Importieren der CSV-Datei.',
            )
        } finally {
            setIsImporting(false)
        }
    }

    return (
        <div style={overlayStyle} onClick={handleCloseModal}>
            <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
                <h2>CSV importieren</h2>

                {!result && (
                    <input
                        type="file"
                        accept=".csv,text/csv"
                        onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileSelected(file)
                        }}
                    />
                )}

                {result && result.missingRequiredColumns.length > 0 && (
                    <div>
                        <p>Не удалось распознать обязательные колонки:</p>
                        <ul>
                            {result.missingRequiredColumns.map((field) => (
                                <li key={field}>{field}</li>
                            ))}
                        </ul>
                        <button onClick={handleReset}>Выбрать другой файл</button>
                    </div>
                )}

                {result && result.missingRequiredColumns.length === 0 && (
                    <>
                        <h3>Найденные колонки</h3>
                        <ul>
                            {Object.entries(result.columnMapping).map(([field, header]) => (
                                <li key={field}>
                                    {field} → "{header}"
                                </li>
                            ))}
                        </ul>

                        <p>
                            Валидных строк:{' '}
                            {result.rows.filter((r) => r.errors.length === 0).length}, с
                            ошибками:{' '}
                            {result.rows.filter((r) => r.errors.length > 0).length}, будет
                            импортировано: {includedRowNumbers.size}
                        </p>

                        <table style={{width: '100%', borderCollapse: 'collapse'}}>
                            <thead>
                                <tr>
                                    <th></th>
                                    <th>#</th>
                                    <th>Company</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Ошибки</th>
                                </tr>
                            </thead>
                            <tbody>
                                {result.rows.map((row) => {
                                    const hasErrors = row.errors.length > 0
                                    return (
                                        <tr
                                            key={row.rowNumber}
                                            style={hasErrors ? {opacity: 0.5} : undefined}
                                        >
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    disabled={hasErrors}
                                                    checked={
                                                        !hasErrors &&
                                                        includedRowNumbers.has(row.rowNumber)
                                                    }
                                                    onChange={() => toggleRow(row.rowNumber)}
                                                />
                                            </td>
                                            <td>{row.rowNumber}</td>
                                            <td>{row.data.company_name ?? '—'}</td>
                                            <td>{row.data.status ?? '—'}</td>
                                            <td>{row.data.applied_at ?? '—'}</td>
                                            <td style={{color: 'crimson'}}>
                                                {row.errors.join(' ')}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>

                        {importError && (
                            <p role="alert" style={{color: 'crimson'}}>
                                {importError}
                            </p>
                        )}

                        <div style={{marginTop: 16, display: 'flex', gap: 8}}>
                            <button onClick={handleReset} disabled={isImporting}>
                                Другой файл
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={includedRowNumbers.size === 0 || isImporting}
                            >
                                {isImporting
                                    ? 'Импорт...'
                                    : `Импортировать (${includedRowNumbers.size})`}
                            </button>
                        </div>
                    </>
                )}

                <button
                    onClick={handleCloseModal}
                    style={{position: 'absolute', top: 16, right: 16}}
                    disabled={isImporting}
                    aria-label="Close"
                >
                    ×
                </button>
            </div>
        </div>
    )
}