export type UserRole = "talker" | "listener";

export type ListenerStatus = "active" | "inactive";

export type CallRequestStatus =
  | "ringing"
  | "accepted"
  | "denied"
  | "timeout"
  | "canceled";

export type MisconductCategory =
  | "harassment"
  | "hate"
  | "sexual_content"
  | "scam"
  | "other";

export interface Profile {
  id: string;
  username: string;
  role: UserRole;
  language_code: string;
  created_at: string;
  banned: boolean;
  reports_count: number;
  rating_avg: number;
  rating_count: number;
}

export interface ListenerPresence {
  user_id: string;
  status: ListenerStatus;
  last_active_at: string;
  session_denies: number;
  activation_until: string | null;
}

export interface Favorite {
  talker_id: string;
  listener_id: string;
  created_at: string;
}

export interface CallRequest {
  id: string;
  talker_id: string;
  listener_id: string;
  description: string;
  status: CallRequestStatus;
  created_at: string;
  expires_at: string;
}

export interface CallSession {
  id: string;
  talker_id: string;
  listener_id: string;
  started_at: string;
  ended_at: string | null;
  ended_reason: string | null;
}

export interface Rating {
  id: string;
  call_session_id: string;
  talker_id: string;
  listener_id: string;
  rating: number;
  created_at: string;
}

export interface MisconductReport {
  id: string;
  call_session_id: string;
  reporter_id: string;
  reported_id: string;
  category: MisconductCategory;
  note: string | null;
  created_at: string;
}

export interface ListenerWithProfile extends Profile {
  status: ListenerStatus;
  isFavorite: boolean;
  isActivating?: boolean;
  activationUntil?: string | null;
}

export interface WebRTCSignal {
  type: "offer" | "answer" | "ice_candidate" | "hangup";
  payload: RTCSessionDescriptionInit | RTCIceCandidateInit | null;
  from: string;
}

export interface RealtimePresencePayload {
  user_id: string;
  username: string;
  language_code: string;
  status: ListenerStatus;
  rating_avg: number;
}
