import { useEffect, useMemo, useRef, useState } from "react";

import { env } from "~/env/client";
import type { FleetWsMessage } from "~/lib/fleet/types";

export interface UseFleetWebSocketArgs {
  erc8004Id: string;
  enabled: boolean;
  onMessage?: (message: FleetWsMessage) => void;
}

export interface FleetWebSocketState {
  isConfigured: boolean;
  isConnected: boolean;
  isTyping: boolean;
  streamText: string;
  lastError: string | null;
}

export function useFleetWebSocket({
  erc8004Id,
  enabled,
  onMessage,
}: UseFleetWebSocketArgs): FleetWebSocketState {
  const wsBaseUrl = env.VITE_FLEET_WS_BASE_URL;
  const isConfigured = Boolean(wsBaseUrl);

  const url = useMemo(() => {
    if (!wsBaseUrl) return null;
    const normalized = wsBaseUrl.replace(/\/+$/, "");
    return `${normalized}/agent/${encodeURIComponent(erc8004Id)}/ws`;
  }, [erc8004Id, wsBaseUrl]);

  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !url) return;

    setLastError(null);
    setIsConnected(false);
    setIsTyping(false);
    setStreamText("");

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onerror = () => setLastError("WebSocket error");

    ws.onmessage = (evt) => {
      try {
        const message = JSON.parse(evt.data) as FleetWsMessage;

        if (message.type === "chat_typing") {
          setIsTyping(Boolean((message as any).is_typing));
        }

        if (message.type === "chat_stream") {
          const chunk = String((message as any).chunk ?? "");
          const isComplete = Boolean((message as any).is_complete);
          setStreamText((prev) => (isComplete ? "" : prev + chunk));
        }

        onMessage?.(message);
      } catch (e) {
        // Ignore malformed payloads
      }
    };

    return () => {
      ws.onopen = null;
      ws.onclose = null;
      ws.onerror = null;
      ws.onmessage = null;
      ws.close();
      wsRef.current = null;
    };
  }, [enabled, onMessage, url]);

  return { isConfigured, isConnected, isTyping, streamText, lastError };
}



