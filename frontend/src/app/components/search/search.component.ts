import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil, distinctUntilChanged } from 'rxjs/operators';
import { TrackService } from '../../services/track.service';
import { AlbumService } from '../../services/album.service';
import { ArtistService } from '../../services/artist.service';
import { PlayerService } from '../../services/player.service';
import { TrackResponse } from '../../models/track.model';
import { AlbumSummaryResponse } from '../../models/album.model';
import { ArtistResponse } from '../../models/artist.model';
import { SideNavComponent } from '../side-nav/side-nav.component';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { TrackActionsComponent } from '../track-actions/track-actions.component';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    SideNavComponent,
    AppHeaderComponent,
    TrackActionsComponent
  ],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit, OnDestroy {
  searchQuery = '';
  private destroy$ = new Subject<void>();

  tracks: TrackResponse[] = [];
  albums: AlbumSummaryResponse[] = [];
  artists: ArtistResponse[] = [];

  isLoadingTracks = false;
  isLoadingAlbums = false;
  isLoadingArtists = false;
  errorTracks = '';
  errorAlbums = '';
  errorArtists = '';

  hasActiveTrack = false;
  currentTrack: TrackResponse | null = null;
  isPlaying = false;

  constructor(
    private route: ActivatedRoute,
    private trackService: TrackService,
    private albumService: AlbumService,
    private artistService: ArtistService,
    public playerService: PlayerService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.route.queryParams
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged((a, b) => a['q'] === b['q'])
      )
      .subscribe(params => {
        const q = (params['q'] ?? '').trim();
        this.searchQuery = q;
        if (q) {
          this.search(q);
        } else {
          this.tracks = [];
          this.albums = [];
          this.artists = [];
          this.errorTracks = '';
          this.errorAlbums = '';
          this.errorArtists = '';
        }
      });

    this.playerService.currentTrack$.pipe(takeUntil(this.destroy$)).subscribe(track => {
      this.hasActiveTrack = !!track;
      this.currentTrack = track ?? null;
    });
    this.playerService.isPlaying$.pipe(takeUntil(this.destroy$)).subscribe(playing => {
      this.isPlaying = playing;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private search(q: string): void {
    this.loadTracks(q);
    this.loadAlbums(q);
    this.loadArtists(q);
  }

  private loadTracks(q: string): void {
    this.isLoadingTracks = true;
    this.errorTracks = '';
    this.trackService.getPage(0, PAGE_SIZE, q).subscribe({
      next: res => {
        this.tracks = res.content;
        this.isLoadingTracks = false;
      },
      error: () => {
        this.errorTracks = 'Не удалось загрузить треки';
        this.isLoadingTracks = false;
      }
    });
  }

  private loadAlbums(q: string): void {
    this.isLoadingAlbums = true;
    this.errorAlbums = '';
    this.albumService.getPage(0, PAGE_SIZE, q).subscribe({
      next: res => {
        this.albums = res.content;
        this.isLoadingAlbums = false;
      },
      error: () => {
        this.errorAlbums = 'Не удалось загрузить альбомы';
        this.isLoadingAlbums = false;
      }
    });
  }

  private loadArtists(q: string): void {
    this.isLoadingArtists = true;
    this.errorArtists = '';
    this.artistService.getPage(0, PAGE_SIZE, q).subscribe({
      next: res => {
        this.artists = res.content;
        this.isLoadingArtists = false;
      },
      error: () => {
        this.errorArtists = 'Не удалось загрузить исполнителей';
        this.isLoadingArtists = false;
      }
    });
  }

  /** Воспроизвести результаты поиска (треки) с выбранного: весь список в плеер, «Следующий»/«Предыдущий» и очередь по этому списку. */
  playTrack(track: TrackResponse): void {
    this.playSearchTrackAt(track);
  }

  private playSearchTrackAt(track: TrackResponse): void {
    if (!this.tracks.length) return;
    const index = this.tracks.findIndex(t => t.id === track.id);
    if (index < 0) return;
    this.playerService.setPlaylist([...this.tracks], index);
  }

  isCurrentTrack(track: TrackResponse): boolean {
    const current = this.playerService.getCurrentTrack();
    return current != null && current.id === track.id;
  }

  togglePlayPause(track: TrackResponse): void {
    if (!this.isCurrentTrack(track)) {
      this.playSearchTrackAt(track);
      return;
    }
    if (this.playerService.isPlaying()) {
      this.playerService.requestPause();
    } else {
      this.playerService.playCurrent();
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

  getArtistCoverStyle(artist: ArtistResponse): SafeStyle | null {
    const url = this.getCoversUrl(artist.coverImagePath);
    return url ? this.sanitizer.bypassSecurityTrustStyle('url(' + url + ')') : null;
  }
}
