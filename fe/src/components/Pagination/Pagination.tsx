import styles from '../../App.module.scss'

interface PaginationProps {
    page: number
    pageCount: number
    onPageChange: (page: number) => void
}

function Pagination({page, pageCount, onPageChange}: PaginationProps) {
    return (
        <div className={styles.pagination}>
            <button
                type="button"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
            >
                ← Zurück
            </button>

            <span>
                Seite {page} von {pageCount}
            </span>

            <button
                type="button"
                disabled={page >= pageCount}
                onClick={() => onPageChange(page + 1)}
            >
                Weiter →
            </button>
        </div>
    )
}

export default Pagination