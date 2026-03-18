import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PlaylistResponse, CreatePlaylistRequest, UpdatePlaylistRequest, PageResponse } from '../models/playlist.model';
import { TrackResponse } from '../models/track.model';

export interface AddTrackToPlaylistRequest {
  trackId: number;
  position?: number;
}

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

  /** Все плейлисты (каталог). Опционально поиск по имени — параметр q. */
  getBrowsePlaylists(page = 0, size = 24, q?: string): Observable<PageResponse<PlaylistResponse>> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    if (q?.trim()) {
      params = params.set('q', q.trim());
    }
    return this.http.get<PageResponse<PlaylistResponse>>(`${this.API_URL}/browse`, { params });
  }

  getById(id: number): Observable<PlaylistResponse> {
    return this.http.get<PlaylistResponse>(`${this.API_URL}/${id}`);
  }

  getTracks(id: number): Observable<TrackResponse[]> {
    return this.http.get<TrackResponse[]>(`${this.API_URL}/${id}/tracks`);
  }

  addTrack(playlistId: number, trackId: number, position?: number): Observable<void> {
    const payload: AddTrackToPlaylistRequest = { trackId, position };
    return this.http.post<void>(`${this.API_URL}/${playlistId}/tracks`, payload);
  }

  removeTrack(playlistId: number, trackId: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${playlistId}/tracks/${trackId}`);
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
