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

  getPage(page = 0, size = 20, q?: string): Observable<PageResponse<ArtistResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (q?.trim()) {
      params = params.set('q', q.trim());
    }
    return this.http.get<PageResponse<ArtistResponse>>(this.API_URL, { params });
  }

  getById(id: number): Observable<ArtistResponse> {
    return this.http.get<ArtistResponse>(`${this.API_URL}/${id}`);
  }

  create(request: CreateArtistRequest): Observable<ArtistResponse> {
    return this.http.post<ArtistResponse>(this.API_URL, request);
  }
}
