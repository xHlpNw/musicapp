export interface TrackResponse {
  id: number;
  title: string;
  durationSeconds: number;
  mimeType?: string;
  trackNumber?: number;
  artistId?: number;
  artistName?: string;
  artists?: { artistId: number; artistName: string; role?: string; displayOrder?: number }[];
  albumId?: number;
  albumTitle?: string;
  /** Альбомы, в которые входит трек (бэкенд может отдавать только это, без albumId на верхнем уровне) */
  albumTracks?: { albumId: number; albumTitle?: string; position?: number }[];
  coverImagePath?: string;
  genreIds?: number[];
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
