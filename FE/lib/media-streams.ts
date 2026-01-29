"use client"

const GLOBAL_KEY = "__activeMediaStreams"

function getStreamSet(): Set<MediaStream> | null {
  if (typeof window === "undefined") return null
  const win = window as typeof window & { [GLOBAL_KEY]?: Set<MediaStream> }
  if (!win[GLOBAL_KEY]) {
    win[GLOBAL_KEY] = new Set<MediaStream>()
  }
  return win[GLOBAL_KEY]!
}

export function registerStream(stream: MediaStream) {
  getStreamSet()?.add(stream)
}

export function unregisterStream(stream: MediaStream) {
  getStreamSet()?.delete(stream)
}

export function stopAllStreams() {
  const set = getStreamSet()
  if (!set) return
  set.forEach((stream) => {
    stream.getTracks().forEach((track) => track.stop())
  })
  set.clear()
}
