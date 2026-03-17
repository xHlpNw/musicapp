export interface AlbumResponse {
  id: number;
  title: string;
  releaseYear?: number;
  releaseDate?: string;
  coverImagePath?: string;
  artistId?: number;
  artistName?: string;
  artists?: AlbumArtistItem[];
  genreIds?: number[];
  tracks?: {
    id: number;
    title: string;
    durationSeconds: number;
    trackNumber?: number;
    position?: number;
    artists?: { artistId: number; artistName: string; displayOrder?: number; role?: string }[];
  }[];
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
  title: string;
  releaseDate: string;
  artistId?: number;
  artists?: { artistId: number; displayOrder: number; role: string }[];
  coverImagePath?: string;
  genreIds?: number[];
}

export interface UpdateAlbumRequest {
  title?: string;
  releaseDate?: string;
  artists?: { artistId: number; displayOrder: number; role: string }[];
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
