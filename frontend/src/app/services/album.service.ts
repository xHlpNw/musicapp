import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AlbumResponse,
  AlbumSummaryResponse,
  CreateAlbumRequest,
  UpdateAlbumRequest,
  PageResponse
} from '../models/album.model';

@Injectable({
  providedIn: 'root'
})
export class AlbumService {
  private readonly API_URL = '/api/albums';

  constructor(private http: HttpClient) {}

  getPage(page = 0, size = 20, q?: string, sort?: string): Observable<PageResponse<AlbumSummaryResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (q?.trim()) {
      params = params.set('q', q.trim());
    }
    if (sort) {
      params = params.set('sort', sort);
    }
    return this.http.get<PageResponse<AlbumSummaryResponse>>(this.API_URL, { params });
  }

  getById(id: number): Observable<AlbumResponse> {
    return this.http.get<AlbumResponse>(`${this.API_URL}/${id}`);
  }

  getByArtistId(artistId: number): Observable<AlbumSummaryResponse[]> {
    return this.http.get<AlbumSummaryResponse[]>(`${this.API_URL}/by-artist/${artistId}`);
  }

  create(request: CreateAlbumRequest): Observable<AlbumResponse> {
    return this.http.post<AlbumResponse>(this.API_URL, request);
  }

  update(id: number, request: UpdateAlbumRequest): Observable<AlbumResponse> {
    return this.http.put<AlbumResponse>(`${this.API_URL}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  uploadCover(id: number, file: File): Observable<AlbumResponse> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<AlbumResponse>(`${this.API_URL}/${id}/cover`, fd);
  }
}
