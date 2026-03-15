import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TrackService } from '../../../services/track.service';
import { TrackResponse } from '../../../models/track.model';

@Component({
  selector: 'app-tracks-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './tracks-list.component.html',
  styleUrls: ['./tracks-list.component.css']
})
export class TracksListComponent implements OnInit {
  tracks: TrackResponse[] = [];
  totalElements = 0;
  totalPages = 0;
  currentPage = 0;
  size = 20;
  searchQuery = '';
  isLoading = false;
  errorMessage = '';
  deletingId: number | null = null;

  constructor(private trackService: TrackService) {}

  ngOnInit(): void {
    this.loadPage();
  }

  loadPage(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.trackService.getPage(this.currentPage, this.size, this.searchQuery || undefined).subscribe({
      next: (res) => {
        this.tracks = res.content;
        this.totalElements = res.totalElements;
        this.totalPages = res.totalPages;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Не удалось загрузить список';
        this.isLoading = false;
      }
    });
  }

  onDelete(track: TrackResponse): void {
    if (!confirm(`Удалить трек «${track.title}»? Файл и связи будут удалены.`)) {
      return;
    }
    this.deletingId = track.id;
    this.trackService.delete(track.id).subscribe({
      next: () => {
        this.deletingId = null;
        this.loadPage();
      },
      error: () => {
        this.deletingId = null;
        this.errorMessage = 'Не удалось удалить трек';
      }
    });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadPage();
  }

  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadPage();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadPage();
    }
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  getTrackArtistNames(track: TrackResponse): string {
    if (track.artists?.length) {
      return track.artists.map((a) => a.artistName).join(', ');
    }
    return track.artistName || '—';
  }

  getAlbumTitle(track: TrackResponse): string {
    if (track.albumTracks?.length) {
      return track.albumTracks.map((a) => a.albumTitle).filter(Boolean).join(', ') || '—';
    }
    return track.albumTitle || '—';
  }
}
