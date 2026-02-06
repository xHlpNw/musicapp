import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { TrackResponse } from '../models/track.model';
import { TrackService } from './track.service';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  private currentTrackSubject = new BehaviorSubject<TrackResponse | null>(null);
  private streamUrlSubject = new BehaviorSubject<string | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private isPlayingSubject = new BehaviorSubject<boolean>(false);
  private playRequestSubject = new Subject<void>();
  private pauseRequestSubject = new Subject<void>();

  public currentTrack$ = this.currentTrackSubject.asObservable();
  public streamUrl$ = this.streamUrlSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();
  public isPlaying$ = this.isPlayingSubject.asObservable();
  public playRequest$ = this.playRequestSubject.asObservable();
  public pauseRequest$ = this.pauseRequestSubject.asObservable();

  private currentBlobUrl: string | null = null;

  constructor(private trackService: TrackService) {}

  setCurrentTrack(track: TrackResponse | null): void {
    this.errorSubject.next(null);
    this.isPlayingSubject.next(false);
    if (track === null) {
      this.revokeCurrentUrl();
      this.currentTrackSubject.next(null);
      this.streamUrlSubject.next(null);
      return;
    }
    if (this.currentTrackSubject.value?.id === track.id && this.currentBlobUrl) {
      this.playRequestSubject.next();
      return;
    }
    this.revokeCurrentUrl();
    this.currentTrackSubject.next(track);
    this.streamUrlSubject.next(null);
    this.loadingSubject.next(true);
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

  setPlaying(playing: boolean): void {
    this.isPlayingSubject.next(playing);
  }

  isPlaying(): boolean {
    return this.isPlayingSubject.value;
  }

  /** Запрос на воспроизведение текущего трека (если уже загружен, но на паузе) */
  playCurrent(): void {
    this.playRequestSubject.next();
  }

  /** Запрос на паузу (плеер и трек остаются выбранными) */
  requestPause(): void {
    this.pauseRequestSubject.next();
  }
}
