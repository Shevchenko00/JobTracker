import { useState } from 'react'
import styles from './App.module.scss'

type Application = {
  id: number
  company: string
  description: string
  date: string
  result: 'На рассмотрении' | 'Приглашение' | 'Отказ'
}

const initialApplications: Application[] = [
  {
    id: 1,
    company: 'Google',
    description: 'Frontend Developer',
    date: '18.08.2026',
    result: 'На рассмотрении',
  },
  {
    id: 2,
    company: 'Microsoft',
    description: 'React Developer',
    date: '15.08.2026',
    result: 'Приглашение',
  },
  {
    id: 3,
    company: 'Apple',
    description: 'Software Engineer',
    date: '12.08.2026',
    result: 'Отказ',
  },
  {
    id: 4,
    company: 'Yandex',
    description: 'Frontend Engineer',
    date: '10.08.2026',
    result: 'На рассмотрении',
  },
]

function App() {
  const [applications, setApplications] =
    useState<Application[]>(initialApplications)

  const [isModalOpen, setIsModalOpen] = useState(false)

  const [company, setCompany] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [result, setResult] =
    useState<Application['result']>('На рассмотрении')

  const handleCreateApplication = () => {
    if (!company || !description || !date) {
      return
    }

    const newApplication: Application = {
      id: Date.now(),
      company,
      description,
      date: new Date(date).toLocaleDateString('ru-RU'),
      result,
    }

    setApplications((prev) => [...prev, newApplication])

    // Очищаем форму
    setCompany('')
    setDescription('')
    setDate('')
    setResult('На рассмотрении')

    // Закрываем модалку
    setIsModalOpen(false)
  }

  return (
    <main className={styles.app}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Мои заявки</h1>

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
              </tr>
            </thead>

            <tbody>
              {applications.map((application) => (
                <tr key={application.id}>
                  <td className={styles.company}>
                    {application.company}
                  </td>

                  <td>
                    {application.description}
                  </td>

                  <td className={styles.date}>
                    {application.date}
                  </td>

                  <td>
                    <span
                      className={`${styles.status} ${
                        application.result === 'Приглашение'
                          ? styles.success
                          : application.result === 'Отказ'
                            ? styles.rejected
                            : styles.pending
                      }`}
                    >
                      {application.result}
                    </span>
                  </td>
                </tr>
              ))}
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
            onClick={(event) => event.stopPropagation()}
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
                onClick={() => setIsModalOpen(false)}
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
                    setDescription(event.target.value)
                  }
                />
              </label>

              <label>
                Дата подачи

                <input
                  type="date"
                  value={date}
                  onChange={(event) =>
                    setDate(event.target.value)
                  }
                />
              </label>

              <label>
                Результат

                <select
                  value={result}
                  onChange={(event) =>
                    setResult(
                      event.target.value as Application['result']
                    )
                  }
                >
                  <option value="На рассмотрении">
                    На рассмотрении
                  </option>

                  <option value="Приглашение">
                    Приглашение
                  </option>

                  <option value="Отказ">
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

export default App;