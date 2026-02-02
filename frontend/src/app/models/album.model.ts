export interface AlbumResponse {
  id: number;
  title: string;
  releaseYear?: number;
  coverImagePath?: string;
  artistId: number;
  artistName: string;
  tracks?: { id: number; title: string; durationSeconds: number; trackNumber?: number }[];
}

export interface AlbumSummaryResponse {
  id: number;
  title: string;
  releaseYear?: number;
  coverImagePath?: string;
  artistId: number;
  artistName: string;
}

export interface CreateAlbumRequest {
  artistId: number;
  title: string;
  releaseYear?: number;
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
