"use client";

import { useEffect, useState, useCallback } from "react";

export interface SSEEvent {
  event: string;
  data: any;
  timestamp: string;
}

export function useSSE(onEventReceived?: (event: SSEEvent) => void) {
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [lastHeartbeat, setLastHeartbeat] = useState<string | null>(null);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource("/api/realtime/stream");

      eventSource.onopen = () => {
        setConnected(true);
        setLastHeartbeat(new Date().toLocaleTimeString());
      };

      eventSource.onerror = () => {
        setConnected(false);
      };

      const handleEvent = (type: string, e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          const evt: SSEEvent = {
            event: type,
            data: parsed,
            timestamp: new Date().toISOString(),
          };
          setLastEvent(evt);
          setLastHeartbeat(new Date().toLocaleTimeString());
          if (onEventReceived) {
            onEventReceived(evt);
          }
        } catch (err) {
          console.error("SSE parse error", err);
        }
      };

      eventSource.addEventListener("shift_started", (e) => handleEvent("shift_started", e));
      eventSource.addEventListener("scan_completed", (e) => handleEvent("scan_completed", e));
      eventSource.addEventListener("message", (e) => handleEvent("message", e));

    } catch (err) {
      console.warn("SSE connection error", err);
      setConnected(false);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [onEventReceived]);

  return { connected, lastEvent, lastHeartbeat };
}
