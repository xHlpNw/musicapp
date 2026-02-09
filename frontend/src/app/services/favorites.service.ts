import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { TrackResponse } from '../models/track.model';
import { AlbumSummaryResponse } from '../models/album.model';
import { ArtistResponse } from '../models/artist.model';
import { PlaylistResponse } from '../models/playlist.model';

export type FavoritesKind = 'tracks' | 'albums' | 'artists' | 'playlists';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private readonly API_URL = '/api/favorites';
  private readonly changed$ = new Subject<FavoritesKind>();

  /** Срабатывает после успешного добавления или удаления из избранного (треки, альбомы, исполнители, плейлисты). */
  readonly favoritesChanged$ = this.changed$.asObservable();

  constructor(private http: HttpClient) {}

  /** Избранные треки: от недавно добавленного к давно добавленному. */
  getTracks(): Observable<TrackResponse[]> {
    return this.http.get<TrackResponse[]>(`${this.API_URL}/tracks`).pipe(
      map(list => list.slice().reverse())
    );
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
    return this.http.post<void>(`${this.API_URL}/tracks/${id}`, {}).pipe(
      tap(() => this.changed$.next('tracks'))
    );
  }

  removeTrack(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/tracks/${id}`).pipe(
      tap(() => this.changed$.next('tracks'))
    );
  }

  addAlbum(id: number): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/albums/${id}`, {}).pipe(
      tap(() => this.changed$.next('albums'))
    );
  }

  removeAlbum(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/albums/${id}`).pipe(
      tap(() => this.changed$.next('albums'))
    );
  }

  addArtist(id: number): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/artists/${id}`, {}).pipe(
      tap(() => this.changed$.next('artists'))
    );
  }

  removeArtist(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/artists/${id}`).pipe(
      tap(() => this.changed$.next('artists'))
    );
  }

  addPlaylist(id: number): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/playlists/${id}`, {}).pipe(
      tap(() => this.changed$.next('playlists'))
    );
  }

  removePlaylist(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/playlists/${id}`).pipe(
      tap(() => this.changed$.next('playlists'))
    );
  }
}
