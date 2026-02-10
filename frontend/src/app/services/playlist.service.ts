import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PlaylistResponse, CreatePlaylistRequest, UpdatePlaylistRequest, PageResponse } from '../models/playlist.model';
import { TrackResponse } from '../models/track.model';

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

  /** Все плейлисты (для раздела «Все плейлисты»). */
  getBrowsePlaylists(page = 0, size = 24): Observable<PageResponse<PlaylistResponse>> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<PageResponse<PlaylistResponse>>(`${this.API_URL}/browse`, { params });
  }

  getById(id: number): Observable<PlaylistResponse> {
    return this.http.get<PlaylistResponse>(`${this.API_URL}/${id}`);
  }

  getTracks(id: number): Observable<TrackResponse[]> {
    return this.http.get<TrackResponse[]>(`${this.API_URL}/${id}/tracks`);
  }

  create(request: CreatePlaylistRequest): Observable<PlaylistResponse> {
    return this.http.post<PlaylistResponse>(this.API_URL, request);
  }

  update(id: number, request: UpdatePlaylistRequest): Observable<PlaylistResponse> {
    return this.http.put<PlaylistResponse>(`${this.API_URL}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  uploadCover(id: number, file: File): Observable<PlaylistResponse> {
    const formData = new FormData();
    formData.set('file', file);
    return this.http.post<PlaylistResponse>(`${this.API_URL}/${id}/cover`, formData);
  }
}
