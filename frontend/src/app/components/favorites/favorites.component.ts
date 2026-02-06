import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { FavoritesService } from '../../services/favorites.service';
import { PlaylistService } from '../../services/playlist.service';
import { AuthService } from '../../services/auth.service';
import { LoginOverlayService } from '../../services/login-overlay.service';
import { PlayerService } from '../../services/player.service';
import { TrackResponse } from '../../models/track.model';
import { AlbumSummaryResponse } from '../../models/album.model';
import { ArtistResponse } from '../../models/artist.model';
import { PlaylistResponse } from '../../models/playlist.model';
import { LoginResponse } from '../../models/auth.model';
import { PlayerComponent } from '../player/player.component';
import { SideNavComponent } from '../side-nav/side-nav.component';

export type FavoritesTab = 'tracks' | 'playlists' | 'albums' | 'artists';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PlayerComponent, SideNavComponent],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.css']
})
export class FavoritesComponent implements OnInit {
  activeTab: FavoritesTab = 'tracks';

  favoriteTracks: TrackResponse[] = [];
  /** Сохранённые в избранное плейлисты (чужие) */
  favoritePlaylists: PlaylistResponse[] = [];
  /** Плейлисты, созданные пользователем */
  createdPlaylists: PlaylistResponse[] = [];
  favoriteAlbums: AlbumSummaryResponse[] = [];
  favoriteArtists: ArtistResponse[] = [];

  isLoadingTracks = false;
  isLoadingPlaylists = false;
  isLoadingCreatedPlaylists = false;
  isLoadingAlbums = false;
  isLoadingArtists = false;
  errorTracks = '';
  errorPlaylists = '';
  errorCreatedPlaylists = '';
  errorAlbums = '';
  errorArtists = '';

  searchQuery = '';
  hasActiveTrack = false;

  constructor(
    private favoritesService: FavoritesService,
    private playlistService: PlaylistService,
    public authService: AuthService,
    public playerService: PlayerService,
    private loginOverlay: LoginOverlayService,
    private sanitizer: DomSanitizer
  ) {}

  openLogin(event: Event): void {
    event.preventDefault();
    this.loginOverlay.open();
  }

  ngOnInit(): void {
    this.loadAll();
    this.playerService.currentTrack$.subscribe(track => {
      this.hasActiveTrack = !!track;
    });
  }

  setTab(tab: FavoritesTab): void {
    this.activeTab = tab;
  }

  loadAll(): void {
    this.loadTracks();
    this.loadPlaylists();
    this.loadCreatedPlaylists();
    this.loadAlbums();
    this.loadArtists();
  }

  loadTracks(): void {
    this.isLoadingTracks = true;
    this.errorTracks = '';
    this.favoritesService.getTracks().subscribe({
      next: (list) => {
        this.favoriteTracks = list;
        this.isLoadingTracks = false;
      },
      error: () => {
        this.errorTracks = 'Не удалось загрузить избранные треки';
        this.isLoadingTracks = false;
      }
    });
  }

  loadPlaylists(): void {
    this.isLoadingPlaylists = true;
    this.errorPlaylists = '';
    this.favoritesService.getPlaylists().subscribe({
      next: (list) => {
        this.favoritePlaylists = list;
        this.isLoadingPlaylists = false;
      },
      error: () => {
        this.errorPlaylists = 'Не удалось загрузить избранные плейлисты';
        this.isLoadingPlaylists = false;
      }
    });
  }

  loadCreatedPlaylists(): void {
    this.isLoadingCreatedPlaylists = true;
    this.errorCreatedPlaylists = '';
    this.playlistService.getMyPlaylists(undefined, 0, 500).subscribe({
      next: (res) => {
        this.createdPlaylists = res.content;
        this.isLoadingCreatedPlaylists = false;
      },
      error: () => {
        this.errorCreatedPlaylists = 'Не удалось загрузить созданные плейлисты';
        this.isLoadingCreatedPlaylists = false;
      }
    });
  }

  /** Для вкладки «Плейлисты»: созданные пользователем + сохранённые в избранное (без дубликатов) */
  get displayPlaylists(): PlaylistResponse[] {
    const createdIds = new Set(this.createdPlaylists.map(p => p.id));
    const onlySaved = this.favoritePlaylists.filter(p => !createdIds.has(p.id));
    return [...this.createdPlaylists, ...onlySaved];
  }

  loadAlbums(): void {
    this.isLoadingAlbums = true;
    this.errorAlbums = '';
    this.favoritesService.getAlbums().subscribe({
      next: (list) => {
        this.favoriteAlbums = list;
        this.isLoadingAlbums = false;
      },
      error: () => {
        this.errorAlbums = 'Не удалось загрузить избранные альбомы';
        this.isLoadingAlbums = false;
      }
    });
  }

  loadArtists(): void {
    this.isLoadingArtists = true;
    this.errorArtists = '';
    this.favoritesService.getArtists().subscribe({
      next: (list) => {
        this.favoriteArtists = list;
        this.isLoadingArtists = false;
      },
      error: () => {
        this.errorArtists = 'Не удалось загрузить избранных исполнителей';
        this.isLoadingArtists = false;
      }
    });
  }

  playTrack(track: TrackResponse): void {
    this.playerService.setCurrentTrack(track);
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  getCoversUrl(path: string | undefined): string | null {
    if (!path) return null;
    return '/api/covers/' + path;
  }

  getTrackCoverClass(index: number): string {
    return 'cover--' + ((index % 6) + 1);
  }

  getTrackCoverStyle(track: TrackResponse): SafeStyle | null {
    const url = this.getCoversUrl(track.coverImagePath);
    return url ? this.sanitizer.bypassSecurityTrustStyle('url(' + url + ')') : null;
  }

  getTrackArtistNames(track: TrackResponse): string {
    if (track.artists?.length) return track.artists.map(a => a.artistName).join(', ');
    if (track.artistName) return track.artistName;
    return '—';
  }

  getAlbumCoverClass(index: number): string {
    return 'cover--' + ((index % 6) + 1);
  }

  getAlbumCoverStyle(album: AlbumSummaryResponse): SafeStyle | null {
    const url = this.getCoversUrl(album.coverImagePath);
    return url ? this.sanitizer.bypassSecurityTrustStyle('url(' + url + ')') : null;
  }

  getAlbumArtistNames(album: AlbumSummaryResponse): string {
    if (album.artists?.length) return album.artists.map(a => a.artistName).join(', ');
    if (album.artistName) return album.artistName;
    return '—';
  }

  getPlaylistCoverClass(index: number): string {
    return 'cover--' + ((index % 6) + 1);
  }

  getArtistCoverClass(index: number): string {
    return 'cover--' + ((index % 6) + 1);
  }

  getArtistCoverStyle(artist: ArtistResponse): SafeStyle | null {
    const url = this.getCoversUrl(artist.coverImagePath);
    return url ? this.sanitizer.bypassSecurityTrustStyle('url(' + url + ')') : null;
  }

  getAvatarUrl(user: LoginResponse): string | null {
    if (!user?.avatarUrl) return null;
    const base = user.avatarUrl.startsWith('http') ? user.avatarUrl : '/api/covers/' + user.avatarUrl;
    const sep = base.includes('?') ? '&' : '?';
    return user.avatarVersion ? `${base}${sep}v=${user.avatarVersion}` : base;
  }

  getInitial(user: LoginResponse): string {
    if (!user?.username) return '?';
    return user.username.charAt(0).toUpperCase();
  }

  trackCountLabel(count: number): string {
    if (count === 1) return '1 трек';
    if (count >= 2 && count <= 4) return `${count} трека`;
    return `${count} треков`;
  }
}
