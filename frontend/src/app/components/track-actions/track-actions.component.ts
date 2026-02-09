import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TrackResponse } from '../../models/track.model';
import { AuthService } from '../../services/auth.service';
import { FavoritesService } from '../../services/favorites.service';
import { PlayerService } from '../../services/player.service';
import { TrackService } from '../../services/track.service';
import { LoginOverlayService } from '../../services/login-overlay.service';

/** Контекст для треков без полных данных (например, в альбоме): альбом и/или исполнители. */
export interface TrackActionsContext {
  albumId?: number;
  artists?: { artistId: number; artistName: string }[];
}

@Component({
  selector: 'app-track-actions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './track-actions.component.html',
  styleUrls: ['./track-actions.component.css']
})
export class TrackActionsComponent implements OnInit, OnDestroy {
  @Input() track!: TrackResponse;
  @Input() context?: TrackActionsContext;

  favoriteTrackIds = new Set<number>();
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private favoritesService: FavoritesService,
    private playerService: PlayerService,
    private trackService: TrackService,
    private router: Router,
    private loginOverlay: LoginOverlayService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
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
      if (kind === 'tracks' && this.authService.isAuthenticated()) {
        this.favoritesService.getTracks().subscribe({
          next: list => { this.favoriteTrackIds = new Set(list.map(t => t.id)); },
          error: () => { this.favoriteTrackIds = new Set(); }
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  hasAlbum(): boolean {
    return this.getAlbumId() != null;
  }

  getAlbumId(): number | null {
    if (this.track.albumId != null) return this.track.albumId;
    if (this.track.albumTracks?.length && this.track.albumTracks[0].albumId != null) return this.track.albumTracks[0].albumId;
    return this.context?.albumId ?? null;
  }

  getTrackArtists(): { artistId: number; artistName: string }[] {
    if (this.track.artists?.length) return this.track.artists;
    if (this.context?.artists?.length) return this.context.artists;
    if (this.track.artistId != null && this.track.artistName) {
      return [{ artistId: this.track.artistId, artistName: this.track.artistName }];
    }
    return [];
  }

  isFavorite(): boolean {
    return this.favoriteTrackIds.has(this.track.id);
  }

  toggleFavorite(event: Event): void {
    event.stopPropagation();
    if (!this.authService.isAuthenticated()) {
      this.loginOverlay.open();
      return;
    }
    if (this.favoriteTrackIds.has(this.track.id)) {
      this.favoritesService.removeTrack(this.track.id).subscribe({
        next: () => { this.favoriteTrackIds.delete(this.track.id); }
      });
    } else {
      this.favoritesService.addTrack(this.track.id).subscribe({
        next: () => { this.favoriteTrackIds.add(this.track.id); }
      });
    }
  }

  addToQueue(event: Event): void {
    event.stopPropagation();
    this.ensureFullTrackThen(t => this.playerService.addToQueue(t));
  }

  addToQueueNext(event: Event): void {
    event.stopPropagation();
    this.ensureFullTrackThen(t => this.playerService.addToQueueNext(t));
  }

  goToAlbum(event: Event): void {
    event.stopPropagation();
    const id = this.getAlbumId();
    if (id != null) this.router.navigate(['/album', id]);
  }

  goToArtist(artistId: number, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/artist', artistId]);
  }

  /** Если трек пришёл без полей для плеера (обложка, исполнитель — например из альбома) — подгружаем по id. */
  private ensureFullTrackThen(fn: (t: TrackResponse) => void): void {
    const hasDisplayInfo = this.track.coverImagePath != null
      || this.track.artistName != null
      || (this.track.artists != null && this.track.artists.length > 0);
    if (this.track.title != null && this.track.durationSeconds != null && hasDisplayInfo) {
      fn(this.track);
      return;
    }
    this.trackService.getById(this.track.id).subscribe({
      next: full => fn(full),
      error: () => fn(this.track)
    });
  }
}
