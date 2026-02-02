import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AlbumResponse,
  AlbumSummaryResponse,
  CreateAlbumRequest,
  PageResponse
} from '../models/album.model';

@Injectable({
  providedIn: 'root'
})
export class AlbumService {
  private readonly API_URL = '/api/albums';

  constructor(private http: HttpClient) {}

  getPage(page = 0, size = 20, q?: string): Observable<PageResponse<AlbumSummaryResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (q?.trim()) {
      params = params.set('q', q.trim());
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
}
