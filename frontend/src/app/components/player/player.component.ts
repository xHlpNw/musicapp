import { Component, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl, SafeStyle } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { PlayerService } from '../../services/player.service';
import { TrackResponse } from '../../models/track.model';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css']
})
export class PlayerComponent implements OnInit, OnDestroy {
  @ViewChild('audioEl') audioRef!: ElementRef<HTMLAudioElement>;
  @ViewChild('titleWrap') titleWrapRef: ElementRef<HTMLElement> | null = null;

  titleOverflows = false;
  marqueeScrollPx = 0;
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
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
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
    // TODO: предыдущий трек
  }

  onNext(): void {
    // TODO: следующий трек
  }

  onPlayPause(): void {
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
  }

  onCanPlay(): void {
    const audio = this.audioRef?.nativeElement;
    if (audio && this.playerService.getCurrentTrack()) {
      audio.play().catch(() => {});
    }
  }

  get progressPercent(): number {
    if (this.duration <= 0) return 0;
    return (this.currentTime / this.duration) * 100;
  }

  onProgressClick(event: MouseEvent): void {
    const audio = this.audioRef?.nativeElement;
    if (!audio || this.duration <= 0) return;
    const bar = event.currentTarget as HTMLElement;
    const rect = bar.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    const time = Math.max(0, Math.min(percent * this.duration, this.duration));
    audio.currentTime = time;
    this.currentTime = time;
  }
}
