import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TrackService } from '../../services/track.service';
import { PlayerComponent } from '../player/player.component';
import { PlayerService } from '../../services/player.service';
import { AuthService } from '../../services/auth.service';
import { TrackResponse } from '../../models/track.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PlayerComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  tracks: TrackResponse[] = [];
  totalElements = 0;
  currentPage = 0;
  size = 20;
  searchQuery = '';
  isLoading = false;
  errorMessage = '';

  constructor(
    private trackService: TrackService,
    public playerService: PlayerService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadTracks();
  }

  loadTracks(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.trackService.getPage(this.currentPage, this.size, this.searchQuery || undefined).subscribe({
      next: (res) => {
        this.tracks = res.content;
        this.totalElements = res.totalElements;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Не удалось загрузить треки';
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadTracks();
  }

  selectTrack(track: TrackResponse): void {
    this.playerService.setCurrentTrack(track);
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  logout(): void {
    this.authService.logout();
  }
}
