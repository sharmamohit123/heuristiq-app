/**
 * Yields the `data` payload of each event in a `text/event-stream` body.
 *
 * Network chunks can end anywhere, including mid-event or mid-character (large
 * run results are split across many chunks behind Cloud Run's frontend), so
 * input is buffered until the blank line that terminates each event.
 */
export async function* readSSEData(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    buffer += done ? decoder.decode() : decoder.decode(value, { stream: true })

    const events = buffer.split(/\r?\n\r?\n/)
    buffer = done ? '' : events.pop() ?? ''

    for (const event of events) {
      const data = event
        .split(/\r?\n/)
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).replace(/^ /, ''))
        .join('\n')
      if (data) yield data
    }

    if (done) return
  }
}
