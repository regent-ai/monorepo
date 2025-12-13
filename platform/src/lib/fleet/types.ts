export interface FleetOrchestrator {
  id: string;
  erc8004_id: string | null;
  session_id: string | null;
  status: "idle" | "executing" | "waiting" | "blocked" | "complete" | null;
  working_dir: string | null;
  input_tokens: number;
  output_tokens: number;
  total_cost: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface FleetTenantsResponse {
  status: "success" | "error";
  tenants: FleetOrchestrator[];
  count: number;
}

export interface FleetTenantInfoResponse {
  status: "success" | "error";
  orchestrator: FleetOrchestrator;
}

export interface FleetCommandAgent {
  id: string;
  orchestrator_agent_id: string;
  name: string;
  model: string | null;
  status: string | null;
  session_id: string | null;
  working_dir: string | null;
  input_tokens: number;
  output_tokens: number;
  total_cost: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  log_count?: number;
}

export interface FleetAgentsResponse {
  status: "success" | "error";
  agents: FleetCommandAgent[];
}

export interface FleetEvent {
  sourceType?: "agent_log" | "orchestrator_chat" | "system_log" | string;
  timestamp?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface FleetEventsResponse {
  status: "success" | "error";
  events: FleetEvent[];
  count: number;
}

export interface FleetChatMessage {
  id: string;
  orchestrator_agent_id: string;
  agent_id: string | null;
  sender_type: "user" | "orchestrator" | "agent" | string;
  receiver_type: "user" | "orchestrator" | "agent" | string;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface FleetChatResponse {
  status: "success" | "error";
  messages: FleetChatMessage[];
  turn_count: number;
}

export interface FleetWsMessage {
  type:
    | "connection_established"
    | "heartbeat"
    | "error"
    | "orchestrator_updated"
    | "agent_created"
    | "agent_updated"
    | "agent_deleted"
    | "agent_status_changed"
    | "agent_log"
    | "agent_summary_update"
    | "system_log"
    | "chat_message"
    | "chat_stream"
    | "chat_typing"
    | string;
  [key: string]: unknown;
}



