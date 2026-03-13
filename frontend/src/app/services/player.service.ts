import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { TrackResponse } from '../models/track.model';
import { TrackService } from './track.service';
import { AuthService } from './auth.service';
import { ListenHistoryService } from './listen-history.service';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  private currentTrackSubject = new BehaviorSubject<TrackResponse | null>(null);
  private streamUrlSubject = new BehaviorSubject<string | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private isPlayingSubject = new BehaviorSubject<boolean>(false);
  private currentTimeSubject = new BehaviorSubject<number>(0);
  private playRequestSubject = new Subject<void>();
  private pauseRequestSubject = new Subject<void>();
  private seekRequestSubject = new Subject<number>();

  public currentTrack$ = this.currentTrackSubject.asObservable();
  public streamUrl$ = this.streamUrlSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();
  public isPlaying$ = this.isPlayingSubject.asObservable();
  public currentTime$ = this.currentTimeSubject.asObservable();
  public playRequest$ = this.playRequestSubject.asObservable();
  public pauseRequest$ = this.pauseRequestSubject.asObservable();
  /** Запрос перемотки к позиции (секунды). Используется комнатой при переключении на тот же трек с начала. */
  public seekRequest$ = this.seekRequestSubject.asObservable();

  /** Единый список воспроизведения: альбом + треки из «Добавить в очередь» / «Играть следующим». */
  private playlist: TrackResponse[] = [];
  private playlistIndex = -1;

  private playlistSubject = new BehaviorSubject<{ list: TrackResponse[]; index: number }>({ list: [], index: -1 });
  public playlist$ = this.playlistSubject.asObservable();

  /** Треки после текущего в плейлисте (для UI «далее в очереди»). */
  public queue$ = this.playlist$.pipe(map(({ list, index }) => (index >= 0 && index < list.length) ? list.slice(index + 1) : []));

  private currentBlobUrl: string | null = null;

  constructor(
    private trackService: TrackService,
    private authService: AuthService,
    private listenHistoryService: ListenHistoryService
  ) {}

  setCurrentTrack(track: TrackResponse | null): void {
    this.errorSubject.next(null);
    this.isPlayingSubject.next(false);
    if (track === null) {
      this.revokeCurrentUrl();
      this.currentTrackSubject.next(null);
      this.streamUrlSubject.next(null);
      this.playlist = [];
      this.playlistIndex = -1;
      this.playlistSubject.next({ list: [], index: -1 });
      return;
    }
    this.playlist = [];
    this.playlistIndex = -1;
    this.playlistSubject.next({ list: [], index: -1 });
    this.loadAndPlayTrack(track);
  }

  /** Воспроизвести список треков (альбом и т.п.) с заданного индекса. «Следующий»/«Предыдущий» переключают по списку. */
  setPlaylist(tracks: TrackResponse[], startIndex: number): void {
    if (!tracks.length || startIndex < 0 || startIndex >= tracks.length) return;
    this.errorSubject.next(null);
    this.isPlayingSubject.next(false);
    this.playlist = [...tracks];
    this.playlistIndex = startIndex;
    this.playlistSubject.next({ list: this.playlist, index: this.playlistIndex });
    this.loadAndPlayTrack(this.playlist[this.playlistIndex]);
  }

  private isMinimalTrack(track: TrackResponse): boolean {
    return !track.coverImagePath && !track.artistName && !(track.artists?.length);
  }

  private loadAndPlayTrack(track: TrackResponse): void {
    if (this.currentTrackSubject.value?.id === track.id && this.currentBlobUrl) {
      this.playRequestSubject.next();
      return;
    }
    if (this.isMinimalTrack(track)) {
      this.trackService.getById(track.id).subscribe({
        next: (full) => {
          if (this.playlist.length > 0 && this.playlistIndex >= 0 && this.playlistIndex < this.playlist.length && this.playlist[this.playlistIndex].id === full.id) {
            this.playlist[this.playlistIndex] = full;
            this.playlistSubject.next({ list: this.playlist, index: this.playlistIndex });
          }
          this.doLoadAndPlay(full);
        },
        error: () => this.doLoadAndPlay(track)
      });
      return;
    }
    this.doLoadAndPlay(track);
  }

  private doLoadAndPlay(track: TrackResponse): void {
    this.revokeCurrentUrl();
    this.currentTrackSubject.next(track);
    this.streamUrlSubject.next(null);
    this.loadingSubject.next(true);
    this.authService.currentUser$.pipe(take(1)).subscribe(user => {
      if (user) {
        this.listenHistoryService.recordPlay(track.id).subscribe({ error: () => {} });
      }
    });
    this.trackService.getStreamBlob(track.id).subscribe({
      next: (blob) => {
        this.currentBlobUrl = URL.createObjectURL(blob);
        this.streamUrlSubject.next(this.currentBlobUrl);
        this.loadingSubject.next(false);
      },
      error: () => {
        this.loadingSubject.next(false);
        this.errorSubject.next('Не удалось загрузить трек');
      }
    });
  }

  private revokeCurrentUrl(): void {
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }
  }

  getCurrentTrack(): TrackResponse | null {
    return this.currentTrackSubject.value;
  }

  getPlaylist(): TrackResponse[] {
    return this.playlist;
  }

  getPlaylistIndex(): number {
    return this.playlistIndex;
  }

  setCurrentTime(seconds: number): void {
    this.currentTimeSubject.next(Math.max(0, seconds));
  }

  getCurrentTime(): number {
    return this.currentTimeSubject.value;
  }

  setPlaying(playing: boolean): void {
    this.isPlayingSubject.next(playing);
  }

  isPlaying(): boolean {
    return this.isPlayingSubject.value;
  }

  playCurrent(): void {
    this.playRequestSubject.next();
  }

  requestPause(): void {
    this.pauseRequestSubject.next();
  }

  /** Перемотать текущий трек к позиции (секунды). Вызывать из комнаты при синхронизации с positionSeconds. */
  requestSeek(positionSeconds: number): void {
    this.seekRequestSubject.next(Math.max(0, positionSeconds));
  }

  /** Добавить трек в конец списка воспроизведения. */
  addToQueue(track: TrackResponse): void {
    const current = this.currentTrackSubject.value;
    if (this.playlist.length > 0) {
      this.playlist = [...this.playlist, track];
      this.playlistSubject.next({ list: this.playlist, index: this.playlistIndex });
    } else if (current) {
      this.playlist = [current, track];
      this.playlistIndex = 0;
      this.playlistSubject.next({ list: this.playlist, index: this.playlistIndex });
    }
  }

  /** Вставить трек следующим (сразу после текущего). */
  addToQueueNext(track: TrackResponse): void {
    const current = this.currentTrackSubject.value;
    if (this.playlist.length > 0 && this.playlistIndex >= 0) {
      const nextIdx = this.playlistIndex + 1;
      this.playlist = [...this.playlist.slice(0, nextIdx), track, ...this.playlist.slice(nextIdx)];
      this.playlistSubject.next({ list: this.playlist, index: this.playlistIndex });
    } else if (current) {
      this.playlist = [current, track];
      this.playlistIndex = 0;
      this.playlistSubject.next({ list: this.playlist, index: this.playlistIndex });
    }
  }

  /** Треки после текущего в плейлисте. */
  getQueue(): TrackResponse[] {
    if (this.playlistIndex < 0 || this.playlistIndex >= this.playlist.length) return [];
    return this.playlist.slice(this.playlistIndex + 1);
  }

  hasNext(): boolean {
    return this.playlist.length > 0 && this.playlistIndex < this.playlist.length - 1;
  }

  hasPrevious(): boolean {
    return this.playlist.length > 0 && this.playlistIndex > 0;
  }

  /** Следующий трек по списку воспроизведения. */
  goToNext(): void {
    if (this.playlist.length > 0 && this.playlistIndex < this.playlist.length - 1) {
      this.playlistIndex++;
      this.playlistSubject.next({ list: this.playlist, index: this.playlistIndex });
      this.loadAndPlayTrack(this.playlist[this.playlistIndex]);
    }
  }

  /** Предыдущий трек: только по плейлисту (индекс - 1). */
  goToPrevious(): boolean {
    if (this.playlist.length > 0 && this.playlistIndex > 0) {
      this.playlistIndex--;
      this.playlistSubject.next({ list: this.playlist, index: this.playlistIndex });
      this.loadAndPlayTrack(this.playlist[this.playlistIndex]);
      return true;
    }
    return false;
  }

  /** Вызвать при окончании трека: автоматически следующий из плейлиста или очереди. */
  onCurrentTrackEnded(): void {
    this.goToNext();
  }
}
