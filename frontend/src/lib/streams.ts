type Handler<T> = (d: T) => void;
export function sse<T = unknown>(url?: string, onMessage?: Handler<T>) {
  if (!url) return () => {};
  const es = new EventSource(url, { withCredentials: false });
  es.onmessage = (e) => {
    try { onMessage?.(JSON.parse(e.data)); } catch { /* ignore */ }
  };
  es.onerror = () => { /* browser will try to reconnect */ };
  return () => es.close();
}
