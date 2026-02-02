export interface ArtistResponse {
  id: number;
  name: string;
  description?: string;
  coverImagePath?: string;
  albums?: { id: number; title: string; releaseYear?: number }[];
}

export interface CreateArtistRequest {
  name: string;
  description?: string;
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
