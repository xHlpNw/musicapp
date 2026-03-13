import { Component, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl, SafeStyle } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { PlayerService } from '../../services/player.service';
import { AuthService } from '../../services/auth.service';
import { FavoritesService } from '../../services/favorites.service';
import { RoomControlService } from '../../services/room-control.service';
import { TrackResponse } from '../../models/track.model';
import { LoginResponse } from '../../models/auth.model';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css']
})
export class PlayerComponent implements OnInit, OnDestroy {
  @ViewChild('audioEl') audioRef!: ElementRef<HTMLAudioElement>;
  @ViewChild('titleWrap') titleWrapRef: ElementRef<HTMLElement> | null = null;

  titleOverflows = false;
  marqueeScrollPx = 0;
  favoriteTrackIds = new Set<number>();
  volumeLevel = 1;
  isMuted = false;

  currentTrack$ = this.playerService.currentTrack$;
  loading$ = this.playerService.loading$;
  error$ = this.playerService.error$;
  streamUrlSafe$ = this.playerService.streamUrl$.pipe(
    map(url => url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) as SafeResourceUrl : null)
  );

  currentTime = 0;
  duration = 0;
  isPlaying = false;

  private destroy$ = new Subject<void>();

  constructor(
    private playerService: PlayerService,
    private authService: AuthService,
    private favoritesService: FavoritesService,
    private roomControlService: RoomControlService,
    private sanitizer: DomSanitizer,
    private router: Router
  ) {}

  get volumePercent(): number {
    return Math.round(this.volumeLevel * 100);
  }

  currentUser: LoginResponse | null = null;

  ngOnInit(): void {
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.favoritesService.getTracks().subscribe({
          next: list => { this.favoriteTrackIds = new Set(list.map(t => t.id)); },
          error: () => { this.favoriteTrackIds = new Set(); }
        });
      } else {
        this.favoriteTrackIds = new Set();
      }
    });
    this.favoritesService.favoritesChanged$.pipe(takeUntil(this.destroy$)).subscribe(kind => {
      if (kind === 'tracks' && this.currentUser) {
        this.favoritesService.getTracks().subscribe({
          next: list => { this.favoriteTrackIds = new Set(list.map(t => t.id)); },
          error: () => { this.favoriteTrackIds = new Set(); }
        });
      }
    });
    this.playerService.currentTrack$.pipe(takeUntil(this.destroy$)).subscribe(track => {
      this.duration = track?.durationSeconds ?? 0;
      this.currentTime = 0;
      this.isPlaying = false;
      this.titleOverflows = false;
      if (track) {
        setTimeout(() => this.checkTitleOverflow(), 0);
      }
    });
    this.playerService.playRequest$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      const audio = this.audioRef?.nativeElement;
      if (audio?.src && this.playerService.getCurrentTrack()) {
        audio.play().catch(() => {});
      }
    });
    this.playerService.pauseRequest$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      const audio = this.audioRef?.nativeElement;
      if (audio) {
        audio.pause();
      }
    });
    this.playerService.seekRequest$.pipe(takeUntil(this.destroy$)).subscribe(seconds => {
      const audio = this.audioRef?.nativeElement;
      if (audio?.src) {
        audio.currentTime = seconds;
        this.currentTime = seconds;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  getArtistName(track: TrackResponse): string {
    if (track.artistName) return track.artistName;
    if (track.artists?.length) return track.artists[0].artistName;
    return '—';
  }

  /** Все исполнители через запятую. */
  getArtistNames(track: TrackResponse): string {
    if (track.artists?.length) {
      return track.artists.map(a => a.artistName).join(', ');
    }
    if (track.artistName) return track.artistName;
    return '—';
  }

  isTrackFavorite(track: TrackResponse): boolean {
    return this.favoriteTrackIds.has(track.id);
  }

  toggleFavorite(track: TrackResponse): void {
    if (!this.currentUser) return;
    if (this.favoriteTrackIds.has(track.id)) {
      this.favoritesService.removeTrack(track.id).subscribe({
        next: () => { this.favoriteTrackIds.delete(track.id); }
      });
    } else {
      this.favoritesService.addTrack(track.id).subscribe({
        next: () => { this.favoriteTrackIds.add(track.id); }
      });
    }
  }

  toggleMute(): void {
    const audio = this.audioRef?.nativeElement;
    if (!audio) return;
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      audio.muted = true;
    } else {
      audio.muted = false;
      audio.volume = this.volumeLevel;
    }
  }

  private applyVolume(): void {
    const audio = this.audioRef?.nativeElement;
    if (audio) {
      audio.muted = this.isMuted;
      audio.volume = this.volumeLevel;
    }
  }

  onVolumeChange(percent: number): void {
    const value = Math.max(0, Math.min(100, percent)) / 100;
    this.volumeLevel = value;
    this.isMuted = value === 0;
    this.applyVolume();
  }

  checkTitleOverflow(): void {
    const wrap = this.titleWrapRef?.nativeElement;
    if (!wrap) return;
    const inner = wrap.firstElementChild as HTMLElement | null;
    if (!inner) return;
    const overflows = inner.scrollWidth > wrap.clientWidth;
    this.titleOverflows = overflows;
    if (overflows) {
      this.marqueeScrollPx = -(inner.scrollWidth - wrap.clientWidth);
    }
  }

  getCoverStyle(track: TrackResponse): SafeStyle | null {
    if (!track?.coverImagePath) return null;
    const url = track.coverImagePath.startsWith('http') ? track.coverImagePath : '/api/covers/' + track.coverImagePath;
    return this.sanitizer.bypassSecurityTrustStyle('url(' + url + ')');
  }

  onPrev(): void {
    if (this.roomControlService.hasControl()) {
      this.roomControlService.previous();
      return;
    }
    if (this.playerService.goToPrevious()) return;
    const audio = this.audioRef?.nativeElement;
    if (audio && this.currentTime > 2) {
      audio.currentTime = 0;
      this.currentTime = 0;
    }
  }

  onNext(): void {
    if (this.roomControlService.hasControl()) {
      this.roomControlService.next();
      return;
    }
    this.playerService.goToNext();
  }

  onPlayPause(): void {
    if (this.roomControlService.hasControl()) {
      this.roomControlService.playPause();
      return;
    }
    const audio = this.audioRef?.nativeElement;
    if (!audio) return;
    if (this.isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    this.isPlaying = !this.isPlaying;
  }

  onTimeUpdate(): void {
    const audio = this.audioRef?.nativeElement;
    if (audio) {
      this.currentTime = audio.currentTime;
      this.playerService.setCurrentTime(this.currentTime);
      if (this.duration === 0 && audio.duration && isFinite(audio.duration)) {
        this.duration = audio.duration;
      }
    }
  }

  onLoadedMetadata(): void {
    const audio = this.audioRef?.nativeElement;
    if (audio?.duration && isFinite(audio.duration)) {
      this.duration = audio.duration;
    }
  }

  onPlay(): void {
    this.isPlaying = true;
    this.playerService.setPlaying(true);
  }

  onPause(): void {
    this.isPlaying = false;
    this.playerService.setPlaying(false);
  }

  onEnded(): void {
    this.isPlaying = false;
    this.currentTime = 0;
    this.playerService.setPlaying(false);
    if (this.roomControlService.hasControl()) {
      this.roomControlService.next();
      return;
    }
    this.playerService.onCurrentTrackEnded();
  }

  onCanPlay(): void {
    const audio = this.audioRef?.nativeElement;
    if (audio && this.playerService.getCurrentTrack() && this.playerService.isPlaying()) {
      audio.play().catch(() => {});
    }
  }

  get progressPercent(): number {
    if (this.duration <= 0) return 0;
    return (this.currentTime / this.duration) * 100;
  }

  /** Есть ли у трека альбом для перехода */
  hasAlbum(track: TrackResponse): boolean {
    return track.albumId != null;
  }

  /** Список исполнителей для подменю (всегда массив, 1+ элементов) */
  getTrackArtists(track: TrackResponse): { artistId: number; artistName: string }[] {
    if (track.artists?.length) return track.artists;
    if (track.artistId != null && track.artistName) return [{ artistId: track.artistId, artistName: track.artistName }];
    return [];
  }

  addToQueue(track: TrackResponse): void {
    this.playerService.addToQueue(track);
  }

  addToQueueNext(track: TrackResponse): void {
    this.playerService.addToQueueNext(track);
  }

  goToAlbum(track: TrackResponse): void {
    if (track.albumId != null) this.router.navigate(['/album', track.albumId]);
  }

  goToArtist(artistId: number): void {
    this.router.navigate(['/artist', artistId]);
  }

  onProgressClick(event: MouseEvent): void {
    const audio = this.audioRef?.nativeElement;
    if (!audio || this.duration <= 0) return;
    const bar = event.currentTarget as HTMLElement;
    const rect = bar.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    const time = Math.max(0, Math.min(percent * this.duration, this.duration));
    if (this.roomControlService.hasControl()) {
      // Хост управляет комнатой — перематываем через комнату, чтобы синхронизировать всех
      this.roomControlService.seekTo(time);
    } else {
      audio.currentTime = time;
      this.currentTime = time;
    }
  }
}
