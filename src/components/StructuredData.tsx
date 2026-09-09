import { useEffect } from 'react'

/**
 * Injects a JSON-LD block into <head> and removes it on unmount, so only the
 * current screen's markup is ever present.
 */
export function StructuredData({ id, data }: { id: string; data: unknown }) {
  useEffect(() => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = `ld-${id}`
    script.text = JSON.stringify(data)

    document.getElementById(`ld-${id}`)?.remove()
    document.head.appendChild(script)

    return () => script.remove()
  }, [id, data])

  return null
}

/** Keeps <title> and the meta description in step with the current view. */
export function PageMeta({ title, description }: { title: string; description?: string }) {
  useEffect(() => {
    const previous = document.title
    document.title = title

    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    const previousDescription = meta?.content
    if (description) {
      if (!meta) {
        meta = document.createElement('meta')
        meta.name = 'description'
        document.head.appendChild(meta)
      }
      meta.content = description
    }

    return () => {
      document.title = previous
      if (meta && previousDescription !== undefined) meta.content = previousDescription
    }
  }, [title, description])

  return null
}
