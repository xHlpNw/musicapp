import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AlbumService } from '../../../services/album.service';
import { ArtistService } from '../../../services/artist.service';
import { ArtistResponse } from '../../../models/artist.model';

@Component({
  selector: 'app-album-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './album-form.component.html',
  styleUrls: ['./album-form.component.css']
})
export class AlbumFormComponent implements OnInit {
  form: FormGroup;
  artists: ArtistResponse[] = [];
  isLoadingArtists = false;
  errorMessage = '';
  isLoading = false;
  isEditMode = false;
  albumId: number | null = null;
  /** Текущая обложка (относительный путь) — превью и чтобы не терять при сохранении без нового файла */
  currentCoverPath: string | null = null;
  selectedCoverFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private albumService: AlbumService,
    private artistService: ArtistService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      artistId: [null as number | null, Validators.required],
      title: ['', [Validators.required, Validators.maxLength(255)]],
      releaseYear: [null as number | null]
    });
  }

  get artistId() {
    return this.form.get('artistId');
  }

  get title() {
    return this.form.get('title');
  }

  /** URL превью обложки в админке */
  get coverPreviewUrl(): string | null {
    if (!this.currentCoverPath) return null;
    const p = this.currentCoverPath.replace(/^\//, '');
    return `/api/covers/${p}?v=${this.albumId ?? 0}`;
  }

  ngOnInit(): void {
    this.loadArtists();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.albumId = +id;
      this.isEditMode = true;
      this.albumService.getById(this.albumId).subscribe({
        next: (album) => {
          const firstArtist = album.artists?.[0];
          const year = album.releaseDate ? parseInt(album.releaseDate.toString().slice(0, 4), 10) : null;
          this.form.patchValue({
            artistId: firstArtist?.artistId ?? null,
            title: album.title ?? '',
            releaseYear: year ?? (album as { releaseYear?: number }).releaseYear ?? null
          });
          this.currentCoverPath = album.coverImagePath ?? null;
        },
        error: () => {
          this.errorMessage = 'Альбом не найден';
        }
      });
    }
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

  onCoverFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedCoverFile = input.files?.length ? input.files[0] : null;
  }

  private buildReleaseDate(): string {
    const y = this.form.get('releaseYear')?.value;
    const year = y != null && !isNaN(y) ? Number(y) : new Date().getFullYear();
    return `${year}-01-01`;
  }

  private buildArtists(): { artistId: number; displayOrder: number; role: string }[] {
    const aid = this.form.get('artistId')?.value;
    if (aid == null) return [];
    return [{ artistId: Number(aid), displayOrder: 0, role: 'PRIMARY' }];
  }

  private navigateToList(): void {
    this.router.navigate(['/admin/albums']);
  }

  private uploadCoverIfNeeded(albumId: number, then: () => void): void {
    if (this.selectedCoverFile) {
      this.albumService.uploadCover(albumId, this.selectedCoverFile).subscribe({
        next: () => then(),
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.error || 'Ошибка при загрузке обложки';
        }
      });
    } else {
      then();
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    const value = this.form.value;
    const releaseDate = this.buildReleaseDate();
    const artists = this.buildArtists();

    if (this.isEditMode && this.albumId != null) {
      this.albumService
        .update(this.albumId, {
          title: value.title,
          releaseDate,
          artists
        })
        .subscribe({
          next: () =>
            this.uploadCoverIfNeeded(this.albumId!, () => {
              this.navigateToList();
            }),
          error: (err) => {
            this.isLoading = false;
            this.errorMessage = err.error?.error || 'Ошибка при сохранении';
          }
        });
    } else {
      this.albumService
        .create({
          title: value.title,
          releaseDate,
          artists
        })
        .subscribe({
          next: (album) =>
            this.uploadCoverIfNeeded(album.id, () => {
              this.navigateToList();
            }),
          error: (err) => {
            this.isLoading = false;
            this.errorMessage = err.error?.error || 'Ошибка при создании';
          }
        });
    }
  }
}
