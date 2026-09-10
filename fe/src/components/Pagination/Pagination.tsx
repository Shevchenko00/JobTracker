import {useTranslation} from 'react-i18next'
import styles from '../../App.module.scss'

interface PaginationProps {
    page: number
    pageCount: number
    onPageChange: (page: number) => void
}

function Pagination({page, pageCount, onPageChange}: PaginationProps) {
    const {t} = useTranslation()

    return (
        <div className={styles.pagination}>
            <button
                type="button"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
            >
                {t('pagination.prev')}
            </button>

            <span>
                {t('pagination.pageOf', {page, pageCount})}
            </span>

            <button
                type="button"
                disabled={page >= pageCount}
                onClick={() => onPageChange(page + 1)}
            >
                {t('pagination.next')}
            </button>
        </div>
    )
}

export default Pagination