import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { TrackService } from '../../services/track.service';
import { AlbumService } from '../../services/album.service';
import { ArtistService } from '../../services/artist.service';
import { AuthService } from '../../services/auth.service';
import { LoginOverlayService } from '../../services/login-overlay.service';
import { PlayerService } from '../../services/player.service';
import { TrackResponse } from '../../models/track.model';
import { AlbumSummaryResponse } from '../../models/album.model';
import { ArtistResponse } from '../../models/artist.model';
import { LoginResponse } from '../../models/auth.model';
import { SideNavComponent } from '../side-nav/side-nav.component';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { TrackActionsComponent } from '../track-actions/track-actions.component';

const POPULAR_TRACKS_SIZE = 10;
const NEW_ALBUMS_SIZE = 10;
const POPULAR_ARTISTS_SIZE = 10;

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule, SideNavComponent, AppHeaderComponent, TrackActionsComponent],
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit {
  searchQuery = '';

  popularTracks: TrackResponse[] = [];
  newAlbums: AlbumSummaryResponse[] = [];
  popularArtists: ArtistResponse[] = [];

  isLoadingTracks = false;
  isLoadingAlbums = false;
  isLoadingArtists = false;
  errorTracks = '';
  errorAlbums = '';
  errorArtists = '';

  /** Плеер показывается только когда выбран трек */
  hasActiveTrack = false;
  /** Текущий трек в плеере (для выделения в списке и кнопки play/pause) */
  currentTrack: TrackResponse | null = null;
  /** Идёт ли воспроизведение */
  isPlaying = false;

  constructor(
    private trackService: TrackService,
    private albumService: AlbumService,
    private artistService: ArtistService,
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
    this.loadPopularTracks();
    this.loadNewAlbums();
    this.loadPopularArtists();
    this.playerService.currentTrack$.subscribe(track => {
      this.hasActiveTrack = !!track;
      this.currentTrack = track ?? null;
    });
    this.playerService.isPlaying$.subscribe(playing => {
      this.isPlaying = playing;
    });
  }

  /** Воспроизвести подборку «Популярные треки» с выбранного: весь список в плеер, «Следующий»/«Предыдущий» и очередь работают по этому списку. */
  playTrack(track: TrackResponse): void {
    this.playPopularTrackAt(track);
  }

  private playPopularTrackAt(track: TrackResponse): void {
    if (!this.popularTracks.length) return;
    const index = this.popularTracks.findIndex(t => t.id === track.id);
    if (index < 0) return;
    this.playerService.setPlaylist([...this.popularTracks], index);
  }

  isCurrentTrack(track: TrackResponse): boolean {
    const current = this.playerService.getCurrentTrack();
    return current != null && current.id === track.id;
  }

  togglePlayPause(track: TrackResponse): void {
    if (!this.isCurrentTrack(track)) {
      this.playPopularTrackAt(track);
      return;
    }
    if (this.playerService.isPlaying()) {
      this.playerService.requestPause();
    } else {
      this.playerService.playCurrent();
    }
  }

  loadPopularTracks(): void {
    this.isLoadingTracks = true;
    this.errorTracks = '';
    this.trackService.getPage(0, POPULAR_TRACKS_SIZE, undefined, 'id,asc').subscribe({
      next: (res) => {
        this.popularTracks = res.content;
        this.isLoadingTracks = false;
      },
      error: () => {
        this.errorTracks = 'Не удалось загрузить треки';
        this.isLoadingTracks = false;
      }
    });
  }

  loadNewAlbums(): void {
    this.isLoadingAlbums = true;
    this.errorAlbums = '';
    this.albumService.getPage(0, NEW_ALBUMS_SIZE, undefined, 'releaseDate,desc').subscribe({
      next: (res) => {
        this.newAlbums = res.content;
        this.isLoadingAlbums = false;
      },
      error: () => {
        this.errorAlbums = 'Не удалось загрузить альбомы';
        this.isLoadingAlbums = false;
      }
    });
  }

  loadPopularArtists(): void {
    this.isLoadingArtists = true;
    this.errorArtists = '';
    this.artistService.getPage(0, POPULAR_ARTISTS_SIZE, undefined, 'id,asc').subscribe({
      next: (res) => {
        this.popularArtists = res.content;
        this.isLoadingArtists = false;
      },
      error: () => {
        this.errorArtists = 'Не удалось загрузить исполнителей';
        this.isLoadingArtists = false;
      }
    });
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  /** URL для обложек (бэкенд может отдавать GET /api/covers/* по пути из БД). */
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

  /** Все исполнители трека через запятую */
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

  /** Все исполнители альбома через запятую */
  getAlbumArtistNames(album: AlbumSummaryResponse): string {
    if (album.artists?.length) return album.artists.map(a => a.artistName).join(', ');
    if (album.artistName) return album.artistName;
    return '—';
  }

  /** URL аватарки: если путь относительный — через /api/covers/, иначе как есть. Cache-busting по avatarVersion. */
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

  /** При наведении на альбом: если список исполнителей не помещается — включаем бегущую строку */
  onAlbumCardMouseEnter(event: MouseEvent): void {
    const card = event.currentTarget as HTMLElement;
    const wrap = card.querySelector('.album-card__artist-wrap') as HTMLElement;
    if (wrap && wrap.scrollWidth > wrap.clientWidth) {
      card.classList.add('album-card--artist-marquee');
    }
  }

  onAlbumCardMouseLeave(event: MouseEvent): void {
    (event.currentTarget as HTMLElement).classList.remove('album-card--artist-marquee');
  }
}
