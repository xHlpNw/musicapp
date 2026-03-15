import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ArtistService } from '../../../services/artist.service';

@Component({
  selector: 'app-artist-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './artist-form.component.html',
  styleUrls: ['./artist-form.component.css']
})
export class ArtistFormComponent implements OnInit {
  form: FormGroup;
  errorMessage = '';
  isLoading = false;
  isEditMode = false;
  artistId: number | null = null;
  /** Текущая обложка (путь) в режиме редактирования — чтобы не сбрасывать при update. */
  currentCoverPath: string | null = null;
  /** Выбранный файл обложки для загрузки. */
  selectedCoverFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private artistService: ArtistService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      description: ['', Validators.maxLength(2000)]
    });
  }

  get name() {
    return this.form.get('name');
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.artistId = +id;
      this.isEditMode = true;
      this.artistService.getById(this.artistId).subscribe({
        next: (artist) => {
          this.form.patchValue({
            name: artist.name,
            description: artist.description ?? ''
          });
          this.currentCoverPath = artist.coverImagePath ?? null;
        },
        error: () => {
          this.errorMessage = 'Исполнитель не найден';
        }
      });
    }
  }

  onCoverFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedCoverFile = input.files?.length ? input.files[0] : null;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    const value = this.form.value;
    const payload = {
      name: value.name,
      description: value.description || undefined,
      coverImagePath: this.currentCoverPath || undefined
    };

    if (this.isEditMode && this.artistId != null) {
      this.artistService.update(this.artistId, payload).subscribe({
        next: () => {
          if (this.selectedCoverFile) {
            this.artistService.uploadCover(this.artistId!, this.selectedCoverFile).subscribe({
              next: () => this.router.navigate(['/admin/artists']),
              error: (err) => {
                this.isLoading = false;
                this.errorMessage = err.error?.error || 'Ошибка при загрузке обложки';
              }
            });
          } else {
            this.router.navigate(['/admin/artists']);
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.error || 'Ошибка при сохранении';
        }
      });
    } else {
      this.artistService.create(payload).subscribe({
        next: (artist) => {
          if (this.selectedCoverFile) {
            this.artistService.uploadCover(artist.id, this.selectedCoverFile).subscribe({
              next: () => this.router.navigate(['/admin/artists']),
              error: (err) => {
                this.isLoading = false;
                this.errorMessage = err.error?.error || 'Ошибка при загрузке обложки';
              }
            });
          } else {
            this.router.navigate(['/admin/artists']);
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.error || 'Ошибка при создании';
        }
      });
    }
  }
}
