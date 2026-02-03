export interface TrackResponse {
  id: number;
  title: string;
  durationSeconds: number;
  mimeType?: string;
  trackNumber?: number;
  artistId?: number;
  artistName?: string;
  artists?: { artistId: number; artistName: string }[];
  albumId?: number;
  albumTitle?: string;
  coverImagePath?: string;
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
