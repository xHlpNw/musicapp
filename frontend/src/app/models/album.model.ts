export interface AlbumResponse {
  id: number;
  title: string;
  releaseYear?: number;
  coverImagePath?: string;
  artistId: number;
  artistName: string;
  tracks?: { id: number; title: string; durationSeconds: number; trackNumber?: number }[];
}

export interface AlbumArtistItem {
  artistId: number;
  artistName: string;
  displayOrder?: number;
  role?: string;
}

export interface AlbumSummaryResponse {
  id: number;
  title: string;
  releaseYear?: number;
  releaseDate?: string;
  coverImagePath?: string;
  artistId?: number;
  artistName?: string;
  artists?: AlbumArtistItem[];
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
