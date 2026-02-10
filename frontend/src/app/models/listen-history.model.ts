import { TrackResponse } from './track.model';

export interface ListenHistoryItem {
  id: number;
  playedTrack: TrackResponse;
  playedAt: string;
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
