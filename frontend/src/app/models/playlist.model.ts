import { TrackResponse } from './track.model';

export interface PlaylistResponse {
  id: number;
  name: string;
  description?: string;
  coverImagePath?: string;
  ownerId: number;
  ownerUsername: string;
  tracks?: TrackResponse[];
  trackCount: number;
}

export interface CreatePlaylistRequest {
  name: string;
  description?: string;
}

export interface UpdatePlaylistRequest {
  name?: string;
  description?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
