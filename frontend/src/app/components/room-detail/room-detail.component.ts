import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { SideNavComponent } from '../side-nav/side-nav.component';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { AuthService } from '../../services/auth.service';
import { PlayerService } from '../../services/player.service';
import { RoomService } from '../../services/room.service';
import { TrackService } from '../../services/track.service';
import { FavoritesService } from '../../services/favorites.service';
import { RoomResponse, RoomQueueItemInfo } from '../../models/room.model';
import { TrackResponse } from '../../models/track.model';
import { RoomSettingsOverlayComponent } from '../room-settings-overlay/room-settings-overlay.component';

export interface ChatMessageData {
  userId: number;
  username: string;
  isHost: boolean;
  text: string;
  time: Date;
}

@Component({
  selector: 'app-room-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SideNavComponent, AppHeaderComponent, RoomSettingsOverlayComponent],
  templateUrl: './room-detail.component.html',
  styleUrls: ['./room-detail.component.css']
})
export class RoomDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private playerService = inject(PlayerService);
  private roomService = inject(RoomService);
  private trackService = inject(TrackService);
  private favoritesService = inject(FavoritesService);
  private destroy$ = new Subject<void>();

  room: RoomResponse | null = null;
  /** Показать кнопку «Присоединиться» (пользователь не участник). */
  needJoin = false;
  showSettingsOverlay = false;
  /** Оверлей «Добавить трек в очередь». */
  showAddToQueueOverlay = false;
  addToQueueSearchQuery = '';
  /** Треки из избранного (показываются, когда поле поиска пустое). */
  addToQueueFavoriteTracks: TrackResponse[] = [];
  addToQueueFavoritesLoading = false;
  /** Результаты поиска (показываются после ввода запроса). */
  addToQueueTracks: TrackResponse[] = [];
  addToQueueLoading = false;
  addToQueueAddingId: number | null = null;
  chatMessages: ChatMessageData[] = [];
  chatInput = '';
  isLoading = true;
  isJoining = false;
  error = '';
  hasActiveTrack = false;

  get isCurrentUserHost(): boolean {
    const user = this.authService.getCurrentUser();
    return !!this.room && user != null && this.room.hostId === user.userId;
  }

  get isRoomPlaying(): boolean {
    return this.room?.playing ?? false;
  }

  /** Обложка для фона и карточки: своя обложка комнаты или обложка текущего трека. */
  get effectiveCoverUrl(): string | null {
    const path = this.room?.coverImagePath ?? this.room?.currentTrackCoverPath;
    if (!path) return null;
    return path.startsWith('http') ? path : '/api/covers/' + path;
  }

  get currentTrackCoverUrl(): string | null {
    const path = this.room?.currentTrackCoverPath;
    if (!path) return null;
    return path.startsWith('http') ? path : '/api/covers/' + path;
  }

  ngOnInit(): void {
    this.playerService.currentTrack$.pipe(takeUntil(this.destroy$)).subscribe(t => {
      this.hasActiveTrack = !!t;
    });

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(paramMap => {
      const id = paramMap.get('id');
      if (id) this.loadRoom(+id);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRoom(id: number): void {
    this.isLoading = true;
    this.error = '';
    this.needJoin = false;
    this.room = null;

    this.roomService.getById(id).pipe(
      takeUntil(this.destroy$),
      catchError((err: { status?: number }) => {
        if (err?.status === 403) {
          this.needJoin = true;
          return this.roomService.getSummary(id);
        }
        this.error = err?.status === 404 ? 'Комната не найдена' : 'Не удалось загрузить комнату';
        this.isLoading = false;
        return of(null);
      })
    ).subscribe((data: RoomResponse | null) => {
      this.isLoading = false;
      if (data) {
        this.room = data;
        if (this.needJoin) {
          this.chatMessages = [];
        }
      }
    });
  }

  joinRoom(): void {
    if (!this.room || this.isJoining) return;
    this.isJoining = true;
    this.roomService.join(this.room.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.needJoin = false;
        this.isJoining = false;
        this.loadRoom(this.room!.id);
      },
      error: () => {
        this.isJoining = false;
        this.error = 'Не удалось присоединиться';
      }
    });
  }

  getCoverUrl(path: string | undefined | null): string {
    if (!path) return '';
    return path.startsWith('http') ? path : '/api/covers/' + path;
  }

  /** Стиль фона для блока обложки: своя обложка комнаты или текущего трека. */
  getEffectiveCoverStyle(): string {
    const path = this.room?.coverImagePath ?? this.room?.currentTrackCoverPath;
    if (!path) return 'none';
    return 'url(' + this.getCoverUrl(path) + ')';
  }

  getCurrentTrackTitle(): string {
    return this.room?.currentTrackTitle ?? '—';
  }

  getCurrentTrackArtist(): string {
    return this.room?.currentTrackArtistName ?? '—';
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  formatTime(d: Date): string {
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }

  getQueueItems(): RoomQueueItemInfo[] {
    return this.room?.queue ?? [];
  }

  roomPlayPause(): void {
    // TODO: PUT /api/rooms/:id/state
  }

  roomSkip(): void {
    // TODO: next track
  }

  roomShuffle(): void {
    // TODO: shuffle queue
  }

  leaveRoom(): void {
    if (!this.room) return;
    this.roomService.leave(this.room.id).subscribe({
      next: () => this.router.navigate(['/rooms'])
    });
  }

  openSettings(): void {
    this.showSettingsOverlay = true;
  }

  closeSettingsOverlay(): void {
    this.showSettingsOverlay = false;
  }

  onSettingsSaved(payload: { name: string; maxMembers: number | null }): void {
    if (!this.room) return;
    this.roomService.update(this.room.id, { name: payload.name, maxMembers: payload.maxMembers })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.room = updated;
          this.showSettingsOverlay = false;
        },
        error: () => {}
      });
  }

  onCoverUpdated(updated: RoomResponse): void {
    this.room = updated;
  }

  invite(): void {
    // TODO: copy link or modal
  }

  sendMessage(): void {
    const text = this.chatInput.trim();
    if (!text) return;
    const user = this.authService.getCurrentUser();
    this.chatMessages.push({
      userId: user?.userId ?? 0,
      username: user?.username ?? 'Гость',
      isHost: this.isCurrentUserHost,
      text,
      time: new Date()
    });
    this.chatInput = '';
  }

  removeFromQueue(item: RoomQueueItemInfo): void {
    if (!this.room) return;
    this.roomService.removeFromQueue(this.room.id, item.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.loadRoom(this.room!.id),
      error: () => {}
    });
  }

  openAddToQueueOverlay(): void {
    this.showAddToQueueOverlay = true;
    this.addToQueueSearchQuery = '';
    this.addToQueueTracks = [];
    this.addToQueueLoading = false;
    this.addToQueueFavoriteTracks = [];
    this.addToQueueFavoritesLoading = true;
    this.favoritesService.getTracks()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tracks) => {
          this.addToQueueFavoriteTracks = tracks;
          this.addToQueueFavoritesLoading = false;
        },
        error: () => {
          this.addToQueueFavoritesLoading = false;
        }
      });
  }

  closeAddToQueueOverlay(): void {
    this.showAddToQueueOverlay = false;
  }

  /** Треки для отображения: при пустом поле — избранное, иначе — результаты поиска. */
  get addToQueueDisplayTracks(): TrackResponse[] {
    return this.addToQueueSearchQuery.trim() ? this.addToQueueTracks : this.addToQueueFavoriteTracks;
  }

  get addToQueueDisplayLoading(): boolean {
    return this.addToQueueSearchQuery.trim() ? this.addToQueueLoading : this.addToQueueFavoritesLoading;
  }

  searchTracksForQueue(): void {
    const query = this.addToQueueSearchQuery.trim();
    if (!query) {
      this.addToQueueTracks = [];
      return;
    }
    this.addToQueueLoading = true;
    this.trackService.getPage(0, 20, query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (page) => {
          this.addToQueueTracks = page.content;
          this.addToQueueLoading = false;
        },
        error: () => {
          this.addToQueueLoading = false;
        }
      });
  }

  addTrackToQueue(track: TrackResponse): void {
    if (!this.room) return;
    this.addToQueueAddingId = track.id;
    this.roomService.addToQueue(this.room.id, track.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.addToQueueAddingId = null;
        this.loadRoom(this.room!.id);
      },
      error: () => {
        this.addToQueueAddingId = null;
      }
    });
  }
}
