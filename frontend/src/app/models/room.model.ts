export interface RoomResponse {
  id: number;
  name: string;
  hostId: number;
  hostUsername: string;
  currentTrackId: number | null;
  /** Id элемента очереди, который играет (однозначно при нескольких копиях одного трека). */
  currentQueueItemId?: number | null;
  currentTrackTitle: string | null;
  currentTrackCoverPath: string | null;
  currentTrackArtistName?: string | null;
  positionSeconds: number;
  playing: boolean;
  memberCount: number;
  maxMembers: number | null;
  /** Обложка комнаты (путь). Если нет — показывать обложку текущего трека. */
  coverImagePath?: string | null;
  isMember?: boolean;
  createdAt: string;
  updatedAt: string;
  queue?: RoomQueueItemInfo[];
  members?: RoomMemberInfo[];
}

export interface RoomQueueItemInfo {
  id: number;
  position: number;
  trackId: number;
  trackTitle?: string;
  trackArtistName?: string | null;
  durationSeconds?: number;
  trackCoverPath?: string | null;
}

export interface RoomMemberInfo {
  userId: number;
  username: string;
}

export interface RoomPageResponse {
  content: RoomResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface CreateRoomRequest {
  name: string;
  maxMembers?: number;
}

export interface UpdateRoomRequest {
  name?: string;
  maxMembers?: number | null;
}

export interface RoomStateRequest {
  currentTrackId?: number | null;
  /** Id элемента очереди (при переключении — однозначно при дубликатах трека). */
  queueItemId?: number | null;
  positionSeconds?: number;
  playing?: boolean;
}
