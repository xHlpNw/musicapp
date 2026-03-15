import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ArtistResponse, CreateArtistRequest, PageResponse } from '../models/artist.model';

@Injectable({
  providedIn: 'root'
})
export class ArtistService {
  private readonly API_URL = '/api/artists';

  constructor(private http: HttpClient) {}

  getPage(page = 0, size = 20, q?: string, sort?: string): Observable<PageResponse<ArtistResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (q?.trim()) {
      params = params.set('q', q.trim());
    }
    if (sort) {
      params = params.set('sort', sort);
    }
    return this.http.get<PageResponse<ArtistResponse>>(this.API_URL, { params });
  }

  getById(id: number): Observable<ArtistResponse> {
    return this.http.get<ArtistResponse>(`${this.API_URL}/${id}`);
  }

  create(request: CreateArtistRequest): Observable<ArtistResponse> {
    return this.http.post<ArtistResponse>(this.API_URL, request);
  }

  update(id: number, request: CreateArtistRequest): Observable<ArtistResponse> {
    return this.http.put<ArtistResponse>(`${this.API_URL}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  uploadCover(id: number, file: File): Observable<ArtistResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ArtistResponse>(`${this.API_URL}/${id}/cover`, formData);
  }
}
