// src/components/usePoll.js
import { useEffect, useRef, useState } from "react";

// Repeatedly calls asyncFn() every interval ms. Supports AbortController.
export default function usePoll(asyncFn, deps = [], intervalMs = 5000) {
  const [data, setData] = useState();
  const timerRef = useRef();

  useEffect(() => {
    let abort = new AbortController();
    let cancelled = false;

    const tick = async () => {
      try {
        const result = await asyncFn(abort.signal);
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled && err.name !== "AbortError") console.error(err);
      } finally {
        timerRef.current = setTimeout(tick, intervalMs);
      }
    };

    tick();
    return () => {
      cancelled = true;
      abort.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return data;
}
