import { useEffect, useState } from 'preact/hooks'
import type { Item } from '../shared/schemas'
import { api } from './api'

export function App() {
  const [items, setItems] = useState<Item[]>([])
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Allgemein')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api
      .list()
      .then(setItems)
      .catch((err: Error) => setError(`Laden fehlgeschlagen: ${err.message}`))
  }, [])

  // Neuen Eintrag über die API anlegen und Liste aktualisieren
  async function add(e: Event) {
    e.preventDefault()
    const cleanTitle = title.trim()
    if (!cleanTitle) {
      setError('Bitte gib einen Titel für die Aufgabe ein.')
      return
    }

    setError('')
    setSubmitting(true)
    try {
      await api.create({
        title: cleanTitle,
        category: category.trim() || 'Allgemein',
        note: '',
      })
      setTitle('')
      setItems(await api.list())
    } catch (err) {
      setError(`Anlegen fehlgeschlagen: ${(err as Error).message}`)
    } finally {
      setSubmitting(false)
    }
  }

  // Erledigt-Status eines Eintrags umschalten
  async function toggle(item: Item) {
    setError('')
    try {
      const updated = await api.update(item.id, { done: !item.done })
      setItems((prev) => prev.map((entry) => (entry.id === item.id ? updated : entry)))
    } catch (err) {
      setError(`Aktualisieren fehlgeschlagen: ${(err as Error).message}`)
    }
  }

  // Eintrag über die API löschen
  async function remove(id: number) {
    setError('')
    try {
      await api.remove(id)
      setItems((prev) => prev.filter((entry) => entry.id !== id))
    } catch (err) {
      setError(`Löschen fehlgeschlagen: ${(err as Error).message}`)
    }
  }

  const doneCount = items.filter((item) => item.done).length
  const openCount = items.length - doneCount

  return (
    <main class="mx-auto max-w-2xl px-4 py-6 sm:p-6">
      <header class="mb-6">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h1 class="flex items-center gap-2 text-2xl font-bold text-brand sm:text-3xl">
            <span aria-hidden="true">✓</span>
            <span>Kepler Task-Manager</span>
          </h1>
          <span class="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand-dark">
            {openCount} offen · {doneCount} erledigt
          </span>
        </div>
        <p class="mt-1 text-sm text-slate-600 sm:text-base">
          Aufgaben anlegen, abhaken und verwalten.
        </p>
      </header>

      <form onSubmit={add} noValidate class="mb-6 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          aria-label="Titel der Aufgabe"
          placeholder="Neue Aufgabe …"
          class="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          value={title}
          onInput={(e) => setTitle((e.target as HTMLInputElement).value)}
          maxLength={80}
        />
        <input
          type="text"
          aria-label="Kategorie"
          placeholder="Kategorie"
          class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 sm:w-36"
          value={category}
          onInput={(e) => setCategory((e.target as HTMLInputElement).value)}
          maxLength={40}
        />
        <button
          type="submit"
          disabled={submitting}
          class="shrink-0 cursor-pointer rounded-lg bg-brand px-4 py-2 font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Speichert …' : 'Hinzufügen'}
        </button>
      </form>

      {error && (
        <div
          role="alert"
          class="mb-4 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          <span>{error}</span>
          <button
            type="button"
            aria-label="Fehlermeldung schließen"
            class="shrink-0 cursor-pointer rounded px-2 py-0.5 text-xs font-semibold text-red-700 hover:bg-red-100"
            onClick={() => setError('')}
          >
            ✕
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <p class="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          Noch keine Aufgaben vorhanden. Lege oben deine erste Aufgabe an!
        </p>
      ) : (
        <ul class="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              class="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300"
            >
              <label class="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => toggle(item)}
                  aria-label={`Aufgabe „${item.title}“ als erledigt markieren`}
                  class="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded accent-brand"
                />
                <div class="min-w-0 flex-1">
                  <span class="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-slate-600">
                    {item.category}
                  </span>
                  <h2
                    class={`mt-1 break-words font-semibold ${
                      item.done ? 'text-slate-400 line-through' : 'text-slate-900'
                    }`}
                  >
                    {item.title}
                  </h2>
                  {item.note && (
                    <p
                      class={`mt-0.5 break-words text-sm ${
                        item.done ? 'text-slate-400 line-through' : 'text-slate-600'
                      }`}
                    >
                      {item.note}
                    </p>
                  )}
                </div>
              </label>

              <button
                type="button"
                onClick={() => remove(item.id)}
                aria-label={`Aufgabe „${item.title}“ löschen`}
                class="shrink-0 cursor-pointer rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                Löschen
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
