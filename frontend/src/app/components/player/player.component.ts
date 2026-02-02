import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerService } from '../../services/player.service';
import { TrackResponse } from '../../models/track.model';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css']
})
export class PlayerComponent {
  currentTrack$ = this.playerService.currentTrack$;

  constructor(private playerService: PlayerService) {}

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  onPlayPause(): void {
    // Пока без воспроизведения — заглушка
  }

  onSeek(): void {
    // Пока без перемотки — заглушка
  }
}
