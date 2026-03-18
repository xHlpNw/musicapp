import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TrackResponse } from '../models/track.model';

export interface AddToPlaylistOverlayState {
  isOpen: boolean;
  track: TrackResponse | null;
}

@Injectable({
  providedIn: 'root'
})
export class AddToPlaylistOverlayService {
  private readonly stateSubject = new BehaviorSubject<AddToPlaylistOverlayState>({
    isOpen: false,
    track: null
  });

  public readonly state$ = this.stateSubject.asObservable();

  open(track: TrackResponse): void {
    this.stateSubject.next({ isOpen: true, track });
  }

  close(): void {
    this.stateSubject.next({ isOpen: false, track: null });
  }
}

