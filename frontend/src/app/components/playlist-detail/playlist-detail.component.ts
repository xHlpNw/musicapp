import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { PlaylistService } from '../../services/playlist.service';
import { FavoritesService } from '../../services/favorites.service';
import { AuthService } from '../../services/auth.service';
import { LoginOverlayService } from '../../services/login-overlay.service';
import { PlayerService } from '../../services/player.service';
import { PlaylistResponse } from '../../models/playlist.model';
import { TrackResponse } from '../../models/track.model';
import { LoginResponse } from '../../models/auth.model';
import { SideNavComponent } from '../side-nav/side-nav.component';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { TrackActionsComponent } from '../track-actions/track-actions.component';
import { switchMap, takeUntil, filter } from 'rxjs/operators';
import { of, Subject } from 'rxjs';

@Component({
  selector: 'app-playlist-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, SideNavComponent, AppHeaderComponent, TrackActionsComponent],
  templateUrl: './playlist-detail.component.html',
  styleUrls: ['./playlist-detail.component.css']
})
export class PlaylistDetailComponent implements OnInit, OnDestroy {
  playlist: PlaylistResponse | null = null;
  tracks: TrackResponse[] = [];
  isLoading = true;
  error = '';
  isFavorite = false;
  favoritePlaylistIds = new Set<number>();
  currentUser: LoginResponse | null = null;
  hasActiveTrack = false;
  isPlaying = false;
  playerLoading = false;
  @ViewChild('coverInput') coverInputRef: ElementRef<HTMLInputElement> | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private playlistService: PlaylistService,
    private favoritesService: FavoritesService,
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
    this.authService.currentUser$.subscribe(u => this.currentUser = u);
    this.playerService.currentTrack$.subscribe(t => this.hasActiveTrack = !!t);
    this.playerService.isPlaying$.subscribe(v => this.isPlaying = v);
    this.playerService.loading$.subscribe(v => this.playerLoading = v);
    if (this.authService.isAuthenticated()) {
      this.loadFavoriteIds();
    }
    this.favoritesService.favoritesChanged$.pipe(
      takeUntil(this.destroy$),
      filter(kind => kind === 'playlists')
    ).subscribe(() => this.loadFavoriteIds());
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (!id) return of(null);
        const numId = +id;
        if (Number.isNaN(numId)) return of(null);
        this.isLoading = true;
        this.error = '';
        return this.playlistService.getById(numId);
      })
    ).subscribe({
      next: (playlist) => {
        if (!playlist) {
          this.router.navigate(['/']);
          return;
        }
        this.playlist = playlist;
        this.isFavorite = this.favoritePlaylistIds.has(playlist.id);
        this.playlistService.getTracks(playlist.id).subscribe({
          next: (tracks) => {
            this.tracks = tracks;
            this.isLoading = false;
          },
          error: () => {
            this.error = 'Не удалось загрузить треки';
            this.isLoading = false;
          }
        });
      },
      error: () => {
        this.error = 'Плейлист не найден';
        this.isLoading = false;
      }
    });
  }

  loadFavoriteIds(): void {
    this.favoritesService.getPlaylists().subscribe({
      next: (list) => {
        this.favoritePlaylistIds = new Set(list.map(p => p.id));
        if (this.playlist) this.isFavorite = this.favoritePlaylistIds.has(this.playlist.id);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  playPlaylist(): void {
    if (this.tracks.length) this.playerService.setPlaylist([...this.tracks], 0);
  }

  stopPlaylist(): void {
    this.playerService.requestPause();
  }

  /** Показывать «Остановить»: текущий трек из плейлиста и (играет или идёт загрузка следующего) — без мигания при смене трека */
  isPlaylistPlaying(): boolean {
    const current = this.playerService.getCurrentTrack();
    if (!current || !this.tracks.length) return false;
    const currentInPlaylist = this.tracks.some(t => t.id === current.id);
    return currentInPlaylist && (this.isPlaying || this.playerLoading);
  }

  /** Трек сейчас воспроизводится (не на паузе) */
  isTrackPlaying(track: TrackResponse): boolean {
    return this.isCurrentTrack(track) && this.isPlaying;
  }

  /** Воспроизвести плейлист с выбранного трека: весь список в плеер, «Следующий»/«Предыдущий» и «Добавить в очередь» работают по этому списку. */
  playTrack(track: TrackResponse, event?: Event): void {
    if (event) event.stopPropagation();
    this.playPlaylistTrackAt(track);
  }

  private playPlaylistTrackAt(track: TrackResponse): void {
    if (!this.tracks.length) return;
    const index = this.tracks.findIndex(t => t.id === track.id);
    if (index < 0) return;
    this.playerService.setPlaylist([...this.tracks], index);
  }

  toggleTrackPlayPause(track: TrackResponse, event: Event): void {
    event.stopPropagation();
    if (this.isTrackPlaying(track)) {
      this.playerService.requestPause();
    } else {
      this.playPlaylistTrackAt(track);
    }
  }

  /** Плейлист создан текущим пользователем — показываем меню (удалить, обложка, название). */
  isOwner(): boolean {
    if (!this.currentUser || !this.playlist) return false;
    return this.playlist.ownerId === this.currentUser.userId;
  }

  /** Жёлтое сердечко: плейлист в избранном или создан текущим пользователем */
  isHeartActive(): boolean {
    if (!this.currentUser || !this.playlist) return false;
    return this.isFavorite || this.playlist.ownerId === this.currentUser.userId;
  }

  openRename(event: Event): void {
    event.stopPropagation();
    if (!this.playlist) return;
    const name = window.prompt('Новое название плейлиста', this.playlist.name);
    if (name == null || name.trim() === '' || name.trim() === this.playlist.name) return;
    this.playlistService.update(this.playlist.id, { name: name.trim() }).subscribe({
      next: (updated) => {
        this.playlist = updated;
      },
      error: () => {}
    });
  }

  openChangeCover(event: Event): void {
    event.stopPropagation();
    if (!this.playlist) return;
    this.coverInputRef?.nativeElement?.click();
  }

  onCoverFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !this.playlist) return;
    this.playlistService.uploadCover(this.playlist.id, file).subscribe({
      next: (updated) => {
        this.playlist = updated;
      },
      error: () => {}
    });
  }

  deletePlaylist(event: Event): void {
    event.stopPropagation();
    if (!this.playlist) return;
    if (!window.confirm(`Удалить плейлист «${this.playlist.name}»? Это действие нельзя отменить.`)) return;
    this.playlistService.delete(this.playlist.id).subscribe({
      next: () => this.router.navigate(['/playlists']),
      error: () => {}
    });
  }

  toggleFavorite(event: Event): void {
    event.stopPropagation();
    if (!this.playlist) return;
    if (!this.authService.isAuthenticated()) {
      this.openLogin(event);
      return;
    }
    if (this.isFavorite) {
      this.favoritesService.removePlaylist(this.playlist.id).subscribe({
        next: () => {
          this.favoritePlaylistIds.delete(this.playlist!.id);
          this.isFavorite = false;
        }
      });
    } else {
      this.favoritesService.addPlaylist(this.playlist.id).subscribe({
        next: () => {
          this.favoritePlaylistIds.add(this.playlist!.id);
          this.isFavorite = true;
        }
      });
    }
  }

  isCurrentTrack(track: TrackResponse): boolean {
    const current = this.playerService.getCurrentTrack();
    return current != null && current.id === track.id;
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  totalDurationSeconds(): number {
    return this.tracks.reduce((sum, t) => sum + t.durationSeconds, 0);
  }

  formatTotalDuration(): string {
    const total = this.totalDurationSeconds();
    const m = Math.floor(total / 60);
    const s = total % 60;
    if (m >= 60) {
      const h = Math.floor(m / 60);
      const mm = m % 60;
      return `${h} ч ${mm} мин`;
    }
    return `${m} мин ${s} сек`;
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

  getPlaylistCoverClass(index: number): string {
    return 'cover--' + ((index % 6) + 1);
  }

  getPlaylistCoverStyle(): SafeStyle | null {
    const url = this.playlist ? this.getCoversUrl(this.playlist.coverImagePath) : null;
    return url ? this.sanitizer.bypassSecurityTrustStyle('url(' + url + ')') : null;
  }

  getAvatarUrl(user: LoginResponse): string | null {
    if (!user?.avatarUrl) return null;
    const base = user.avatarUrl.startsWith('http') ? user.avatarUrl : '/api/covers/' + user.avatarUrl;
    const sep = base.includes('?') ? '&' : '?';
    return user.avatarVersion ? `${base}${sep}v=${user.avatarVersion}` : base;
  }

  getInitial(user: LoginResponse): string {
    return user?.username?.charAt(0)?.toUpperCase() ?? '?';
  }
}
