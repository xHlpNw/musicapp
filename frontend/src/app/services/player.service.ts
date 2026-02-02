import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TrackResponse } from '../models/track.model';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  private currentTrackSubject = new BehaviorSubject<TrackResponse | null>(null);
  public currentTrack$ = this.currentTrackSubject.asObservable();

  setCurrentTrack(track: TrackResponse | null): void {
    this.currentTrackSubject.next(track);
  }

  getCurrentTrack(): TrackResponse | null {
    return this.currentTrackSubject.value;
  }
}
