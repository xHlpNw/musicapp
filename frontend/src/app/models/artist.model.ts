export interface ArtistResponse {
  id: number;
  name: string;
  description?: string;
  coverImagePath?: string;
  genreIds?: number[];
  albums?: { id: number; title: string; releaseYear?: number; releaseDate?: string }[];
}

export interface CreateArtistRequest {
  name: string;
  description?: string;
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
