import {useEffect, useState} from 'react'
import styles from './App.module.scss'

type ApplicationStatus = 'pending' | 'accepted' | 'rejected'

type Application = {
    id: number
    company_name: string
    description: string
    applied_at: string
    status: ApplicationStatus
}

const statusLabels: Record<ApplicationStatus, string> = {
    pending: 'На рассмотрении',
    accepted: 'Приглашение',
    rejected: 'Отказ',
}

function App() {
    const [applications, setApplications] =
        useState<Application[]>([])

    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState(false)

    const [isModalOpen, setIsModalOpen] = useState(false)

    const [company, setCompany] = useState('')
    const [description, setDescription] = useState('')
    const [result, setResult] =
        useState<ApplicationStatus>('pending')

    useEffect(() => {
        const fetchApplications = async () => {
            setIsLoading(true)
            setLoadError(false)

            try {
                const response = await fetch(
                    'http://localhost:9212/jobs/'
                )

                if (!response.ok) {
                    throw new Error(
                        `Ошибка загрузки заявок: ${response.status}`
                    )
                }

                const data: Application[] =
                    await response.json()

                setApplications(data)
            } catch (error) {
                console.error(
                    'Ошибка при загрузке заявок:',
                    error
                )
                setLoadError(true)
            } finally {
                setIsLoading(false)
            }
        }

        fetchApplications()
    }, [])

    const handleDeleteApplication = async (id: number) => {
        try {
            const response = await fetch(
                `http://localhost:9212/jobs/delete/${id}/`,
                {
                    method: 'DELETE',
                }
            )

            if (!response.ok) {
                throw new Error(
                    `Ошибка удаления заявки: ${response.status}`
                )
            }

            setApplications((prev) =>
                prev.filter(
                    (application) => application.id !== id
                )
            )
        } catch (error) {
            console.error(
                'Ошибка при удалении заявки:',
                error
            )
        }
    }

    const handleCreateApplication = async () => {
        if (!company || !description) {
            return
        }

        try {
            const response = await fetch(
                'http://localhost:9212/jobs/create/',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        company_name: company,
                        description,
                        status: result,
                    }),
                }
            )

            if (!response.ok) {
                throw new Error(
                    `Ошибка создания заявки: ${response.status}`
                )
            }

            const newApplication: Application =
                await response.json()

            setApplications((prev) => [
                ...prev,
                newApplication,
            ])

            setCompany('')
            setDescription('')
            setResult('pending')

            setIsModalOpen(false)
        } catch (error) {
            console.error(
                'Ошибка при создании заявки:',
                error
            )
        }
    }

    return (
        <main className={styles.app}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <div>
                        <h1 className={styles.title}>
                            Мои заявки
                        </h1>

                        <p className={styles.subtitle}>
                            Отслеживание откликов на вакансии
                        </p>
                    </div>

                    <button
                        className={styles.createButton}
                        onClick={() => setIsModalOpen(true)}
                    >
                        <span>+</span>
                        Создать заявку
                    </button>
                </header>

                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                        <tr>
                            <th>Компания</th>
                            <th>Описание</th>
                            <th>Дата подачи</th>
                            <th>Результат</th>
                            <th className={styles.actionsHead}></th>
                        </tr>
                        </thead>

                        <tbody>
                        {isLoading ? (
                            <tr>
                                <td
                                    className={styles.empty}
                                    colSpan={5}
                                >
                                    Загрузка заявок...
                                </td>
                            </tr>
                        ) : loadError ? (
                            <tr>
                                <td
                                    className={styles.empty}
                                    colSpan={5}
                                >
                                    Не удалось загрузить заявки.
                                    Попробуйте обновить страницу.
                                </td>
                            </tr>
                        ) : applications.length !== 0 ? (
                            applications.map((application) => (
                                <tr key={application.id}>
                                    <td className={styles.company}>
                                        {application.company_name}
                                    </td>

                                    <td>
                                        {application.description}
                                    </td>

                                    <td className={styles.date}>
                                        {new Date(
                                            application.applied_at
                                        ).toLocaleDateString('ru-RU')}
                                    </td>

                                    <td>
                    <span
                        className={`${styles.status} ${
                            application.status === 'accepted'
                                ? styles.success
                                : application.status === 'rejected'
                                    ? styles.rejected
                                    : styles.pending
                        }`}
                    >
                      {statusLabels[
                          application.status
                          ]}
                    </span>
                                    </td>

                                    <td className={styles.actions}>
                                        <button
                                            className={styles.deleteButton}
                                            onClick={() =>
                                                handleDeleteApplication(
                                                    application.id
                                                )
                                            }
                                            aria-label="Удалить заявку"
                                            title="Удалить заявку"
                                        >
                                            ×
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    className={styles.empty}
                                    colSpan={5}
                                >
                                    Пока нет ни одной заявки
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div
                    className={styles.overlay}
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        className={styles.modal}
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <div className={styles.modalHeader}>
                            <div>
                                <h2>Новая заявка</h2>

                                <p>
                                    Добавьте информацию о вакансии
                                </p>
                            </div>

                            <button
                                className={styles.closeButton}
                                onClick={() =>
                                    setIsModalOpen(false)
                                }
                            >
                                ×
                            </button>
                        </div>

                        <form
                            className={styles.form}
                            onSubmit={(event) => {
                                event.preventDefault()
                                handleCreateApplication()
                            }}
                        >
                            <label>
                                Компания

                                <input
                                    type="text"
                                    placeholder="Например, Google"
                                    value={company}
                                    onChange={(event) =>
                                        setCompany(event.target.value)
                                    }
                                />
                            </label>

                            <label>
                                Описание

                                <input
                                    type="text"
                                    placeholder="Например, Frontend Developer"
                                    value={description}
                                    onChange={(event) =>
                                        setDescription(
                                            event.target.value
                                        )
                                    }
                                />
                            </label>

                            <label>
                                Результат

                                <select
                                    value={result}
                                    onChange={(event) =>
                                        setResult(
                                            event.target
                                                .value as ApplicationStatus
                                        )
                                    }
                                >
                                    <option value="pending">
                                        На рассмотрении
                                    </option>

                                    <option value="accepted">
                                        Приглашение
                                    </option>

                                    <option value="rejected">
                                        Отказ
                                    </option>
                                </select>
                            </label>

                            <button
                                type="submit"
                                className={styles.submitButton}
                            >
                                Создать заявку
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </main>
    )
}

export default App