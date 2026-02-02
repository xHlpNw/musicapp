import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
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

  public currentTrack$ = this.currentTrackSubject.asObservable();
  public streamUrl$ = this.streamUrlSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  private currentBlobUrl: string | null = null;

  constructor(private trackService: TrackService) {}

  setCurrentTrack(track: TrackResponse | null): void {
    this.errorSubject.next(null);
    if (track === null) {
      this.revokeCurrentUrl();
      this.currentTrackSubject.next(null);
      this.streamUrlSubject.next(null);
      return;
    }
    if (this.currentTrackSubject.value?.id === track.id && this.currentBlobUrl) {
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
}
