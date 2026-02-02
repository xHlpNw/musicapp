import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TrackService } from '../../../services/track.service';
import { ArtistService } from '../../../services/artist.service';
import { AlbumService } from '../../../services/album.service';
import { ArtistResponse } from '../../../models/artist.model';
import { AlbumSummaryResponse } from '../../../models/album.model';

@Component({
  selector: 'app-track-upload',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './track-upload.component.html',
  styleUrls: ['./track-upload.component.css']
})
export class TrackUploadComponent implements OnInit {
  form: FormGroup;
  artists: ArtistResponse[] = [];
  albums: AlbumSummaryResponse[] = [];
  isLoadingArtists = false;
  errorMessage = '';
  isLoading = false;
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private trackService: TrackService,
    private artistService: ArtistService,
    private albumService: AlbumService,
    private router: Router
  ) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(255)]],
      artistId: [null as number | null],
      artistName: ['', Validators.maxLength(255)],
      albumId: [null as number | null],
      trackNumber: [null as number | null],
      durationSeconds: [null as number | null, [Validators.required, Validators.min(1)]]
    });
  }

  get title() {
    return this.form.get('title');
  }

  get durationSeconds() {
    return this.form.get('durationSeconds');
  }

  ngOnInit(): void {
    this.loadArtists();
  }

  loadArtists(): void {
    this.isLoadingArtists = true;
    this.artistService.getPage(0, 500).subscribe({
      next: (res) => {
        this.artists = res.content;
        this.isLoadingArtists = false;
      },
      error: () => {
        this.isLoadingArtists = false;
      }
    });
  }

  onArtistChange(): void {
    const artistId = this.form.get('artistId')?.value;
    this.albums = [];
    if (artistId) {
      this.albumService.getByArtistId(artistId).subscribe({
        next: (list) => (this.albums = list)
      });
    }
    this.form.patchValue({ albumId: null });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.selectedFile) {
      this.errorMessage = 'Выберите аудиофайл';
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';

    const fd = new FormData();
    fd.append('file', this.selectedFile);
    fd.append('title', this.form.value.title);
    fd.append('durationSeconds', String(this.form.value.durationSeconds));

    const artistId = this.form.value.artistId;
    const artistName = this.form.value.artistName?.trim();
    if (artistId) {
      fd.append('artistId', String(artistId));
    } else if (artistName) {
      fd.append('artistName', artistName);
    } else {
      this.errorMessage = 'Укажите исполнителя (выберите из списка или введите имя)';
      this.isLoading = false;
      return;
    }

    if (this.form.value.albumId) {
      fd.append('albumId', String(this.form.value.albumId));
    }
    if (this.form.value.trackNumber != null) {
      fd.append('trackNumber', String(this.form.value.trackNumber));
    }

    this.trackService.upload(fd).subscribe({
      next: () => {
        this.router.navigate(['/admin/tracks']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error || 'Ошибка при загрузке';
      }
    });
  }
}
