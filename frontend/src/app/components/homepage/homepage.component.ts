import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { TrackService } from '../../services/track.service';
import { AlbumService } from '../../services/album.service';
import { ArtistService } from '../../services/artist.service';
import { TrackResponse } from '../../models/track.model';
import { AlbumSummaryResponse } from '../../models/album.model';
import { ArtistResponse } from '../../models/artist.model';

const POPULAR_TRACKS_SIZE = 5;
const NEW_ALBUMS_SIZE = 10;
const POPULAR_ARTISTS_SIZE = 10;

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit {
  searchQuery = '';

  popularTracks: TrackResponse[] = [];
  newAlbums: AlbumSummaryResponse[] = [];
  popularArtists: ArtistResponse[] = [];

  isLoadingTracks = false;
  isLoadingAlbums = false;
  isLoadingArtists = false;
  errorTracks = '';
  errorAlbums = '';
  errorArtists = '';

  constructor(
    private trackService: TrackService,
    private albumService: AlbumService,
    private artistService: ArtistService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadPopularTracks();
    this.loadNewAlbums();
    this.loadPopularArtists();
  }

  loadPopularTracks(): void {
    this.isLoadingTracks = true;
    this.errorTracks = '';
    this.trackService.getPage(0, POPULAR_TRACKS_SIZE, undefined, 'id,asc').subscribe({
      next: (res) => {
        this.popularTracks = res.content;
        this.isLoadingTracks = false;
      },
      error: () => {
        this.errorTracks = 'Не удалось загрузить треки';
        this.isLoadingTracks = false;
      }
    });
  }

  loadNewAlbums(): void {
    this.isLoadingAlbums = true;
    this.errorAlbums = '';
    this.albumService.getPage(0, NEW_ALBUMS_SIZE, undefined, 'releaseDate,desc').subscribe({
      next: (res) => {
        this.newAlbums = res.content;
        this.isLoadingAlbums = false;
      },
      error: () => {
        this.errorAlbums = 'Не удалось загрузить альбомы';
        this.isLoadingAlbums = false;
      }
    });
  }

  loadPopularArtists(): void {
    this.isLoadingArtists = true;
    this.errorArtists = '';
    this.artistService.getPage(0, POPULAR_ARTISTS_SIZE, undefined, 'id,asc').subscribe({
      next: (res) => {
        this.popularArtists = res.content;
        this.isLoadingArtists = false;
      },
      error: () => {
        this.errorArtists = 'Не удалось загрузить исполнителей';
        this.isLoadingArtists = false;
      }
    });
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  /** URL для обложек (бэкенд может отдавать GET /api/covers/* по пути из БД). */
  getCoversUrl(path: string | undefined): string | null {
    if (!path) return null;
    return '/api/covers/' + path;
  }

  getTrackCoverClass(index: number): string {
    return 'cover--' + ((index % 6) + 1);
  }

  getTrackCoverStyle(track: TrackResponse): SafeStyle | null {
    const url = this.getCoversUrl(track.coverImagePath);
    return url ? this.sanitizer.bypassSecurityTrustStyle('url(' + url + ')') : null;
  }

  getTrackArtistName(track: TrackResponse): string {
    if (track.artistName) return track.artistName;
    if (track.artists?.length) return track.artists[0].artistName;
    return '—';
  }

  getAlbumCoverClass(index: number): string {
    return 'cover--' + ((index % 6) + 1);
  }

  getAlbumCoverStyle(album: AlbumSummaryResponse): SafeStyle | null {
    const url = this.getCoversUrl(album.coverImagePath);
    return url ? this.sanitizer.bypassSecurityTrustStyle('url(' + url + ')') : null;
  }

  getAlbumArtistName(album: AlbumSummaryResponse): string {
    if (album.artistName) return album.artistName;
    if (album.artists?.length) return album.artists[0].artistName;
    return '—';
  }
}
