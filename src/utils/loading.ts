const frames = ['-', '\\', '|', '/']

function isProbablyInteractive(): boolean {
  return process.stderr.isTTY === true && process.env.CI !== 'true'
}

export async function withLoading<T>(message: string, fn: () => Promise<T>): Promise<T> {
  if (!isProbablyInteractive()) {
    // When not in a TTY (CI, redirected output), avoid cursor control; just run.
    return fn()
  }

  process.stderr.write(`${message} `)
  let idx = 0
  let done = false

  const interval = setInterval(() => {
    if (done) return
    const frame = frames[idx]!
    idx = (idx + 1) % frames.length
    process.stderr.write(`\r${message} ${frame}`)
  }, 100)

  try {
    const result = await fn()
    return result
  } finally {
    done = true
    clearInterval(interval)
    process.stderr.write(`\r${message} done\n`)
  }
}
