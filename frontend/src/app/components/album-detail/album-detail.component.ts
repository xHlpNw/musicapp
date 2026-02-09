import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { AlbumService } from '../../services/album.service';
import { TrackService } from '../../services/track.service';
import { AuthService } from '../../services/auth.service';
import { LoginOverlayService } from '../../services/login-overlay.service';
import { PlayerService } from '../../services/player.service';
import { AlbumResponse } from '../../models/album.model';
import { TrackResponse } from '../../models/track.model';
import { TrackActionsContext } from '../track-actions/track-actions.component';
import { LoginResponse } from '../../models/auth.model';
import { SideNavComponent } from '../side-nav/side-nav.component';
import { TrackActionsComponent } from '../track-actions/track-actions.component';
import { switchMap, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';

@Component({
  selector: 'app-album-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, SideNavComponent, TrackActionsComponent],
  templateUrl: './album-detail.component.html',
  styleUrls: ['./album-detail.component.css']
})
export class AlbumDetailComponent implements OnInit, OnDestroy {
  album: AlbumResponse | null = null;
  isLoading = true;
  error = '';
  hasActiveTrack = false;
  isPlaying = false;
  currentUser: LoginResponse | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private albumService: AlbumService,
    private trackService: TrackService,
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
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (!id) return of(null);
        const numId = +id;
        if (Number.isNaN(numId)) return of(null);
        this.isLoading = true;
        this.error = '';
        return this.albumService.getById(numId);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (album) => {
        if (!album) {
          this.router.navigate(['/']);
          return;
        }
        this.album = album;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Альбом не найден';
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getAlbumArtistName(): string {
    if (!this.album) return '—';
    if (this.album.artistName) return this.album.artistName;
    if (this.album.artists?.length) return this.album.artists[0].artistName;
    return '—';
  }

  getAlbumArtistId(): number | null {
    if (!this.album) return null;
    if (this.album.artistId != null) return this.album.artistId;
    if (this.album.artists?.length) return this.album.artists[0].artistId;
    return null;
  }

  /** Контекст для track-actions: альбом и исполнители (треки в альбоме приходят без этих полей). */
  getAlbumTrackContext(): TrackActionsContext | undefined {
    if (!this.album) return undefined;
    const albumId = this.album.id;
    const artists = this.album.artists?.length
      ? this.album.artists.map(a => ({ artistId: a.artistId, artistName: a.artistName }))
      : (this.getAlbumArtistId() != null ? [{ artistId: this.getAlbumArtistId()!, artistName: this.getAlbumArtistName() }] : undefined);
    return { albumId, artists };
  }

  /** Треки альбома могут быть TrackSummary (id, title, durationSeconds). Для воспроизведения загружаем полный трек. */
  playTrack(trackId: number, event?: Event): void {
    if (event) event.stopPropagation();
    this.trackService.getById(trackId).subscribe({
      next: (track) => this.playerService.setCurrentTrack(track),
      error: () => {}
    });
  }

  isCurrentTrack(trackId: number): boolean {
    const current = this.playerService.getCurrentTrack();
    return current != null && current.id === trackId;
  }

  isTrackPlaying(trackId: number): boolean {
    return this.isCurrentTrack(trackId) && this.isPlaying;
  }

  toggleTrackPlayPause(trackId: number, event: Event): void {
    event.stopPropagation();
    if (this.isTrackPlaying(trackId)) {
      this.playerService.requestPause();
    } else {
      this.trackService.getById(trackId).subscribe({
        next: (track) => this.playerService.setCurrentTrack(track),
        error: () => {}
      });
    }
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

  getCoverStyle(path: string | undefined): SafeStyle | null {
    const url = this.getCoversUrl(path);
    return url ? this.sanitizer.bypassSecurityTrustStyle('url(' + url + ')') : null;
  }

  getTrackCoverClass(index: number): string {
    return 'cover--' + ((index % 6) + 1);
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
