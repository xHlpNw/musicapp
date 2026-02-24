export interface RoomResponse {
  id: number;
  name: string;
  hostId: number;
  hostUsername: string;
  currentTrackId: number | null;
  currentTrackTitle: string | null;
  currentTrackCoverPath: string | null;
  currentTrackArtistName?: string | null;
  positionSeconds: number;
  playing: boolean;
  memberCount: number;
  maxMembers: number | null;
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
