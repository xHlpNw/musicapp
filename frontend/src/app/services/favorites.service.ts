import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TrackResponse } from '../models/track.model';
import { AlbumSummaryResponse } from '../models/album.model';
import { ArtistResponse } from '../models/artist.model';
import { PlaylistResponse } from '../models/playlist.model';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private readonly API_URL = '/api/favorites';

  constructor(private http: HttpClient) {}

  getTracks(): Observable<TrackResponse[]> {
    return this.http.get<TrackResponse[]>(`${this.API_URL}/tracks`);
  }

  getAlbums(): Observable<AlbumSummaryResponse[]> {
    return this.http.get<AlbumSummaryResponse[]>(`${this.API_URL}/albums`);
  }

  getArtists(): Observable<ArtistResponse[]> {
    return this.http.get<ArtistResponse[]>(`${this.API_URL}/artists`);
  }

  getPlaylists(): Observable<PlaylistResponse[]> {
    return this.http.get<PlaylistResponse[]>(`${this.API_URL}/playlists`);
  }

  addTrack(id: number): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/tracks/${id}`, {});
  }

  removeTrack(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/tracks/${id}`);
  }

  addAlbum(id: number): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/albums/${id}`, {});
  }

  removeAlbum(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/albums/${id}`);
  }

  addArtist(id: number): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/artists/${id}`, {});
  }

  removeArtist(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/artists/${id}`);
  }

  addPlaylist(id: number): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/playlists/${id}`, {});
  }

  removePlaylist(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/playlists/${id}`);
  }
}
