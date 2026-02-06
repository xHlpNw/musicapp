import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PlaylistResponse, CreatePlaylistRequest, PageResponse } from '../models/playlist.model';

@Injectable({
  providedIn: 'root'
})
export class PlaylistService {
  private readonly API_URL = '/api/playlists';

  constructor(private http: HttpClient) {}

  getMyPlaylists(q?: string, page = 0, size = 50): Observable<PageResponse<PlaylistResponse>> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    if (q?.trim()) {
      params = params.set('q', q.trim());
    }
    return this.http.get<PageResponse<PlaylistResponse>>(this.API_URL, { params });
  }

  getById(id: number): Observable<PlaylistResponse> {
    return this.http.get<PlaylistResponse>(`${this.API_URL}/${id}`);
  }

  create(request: CreatePlaylistRequest): Observable<PlaylistResponse> {
    return this.http.post<PlaylistResponse>(this.API_URL, request);
  }
}
