import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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

  constructor(
    private fb: FormBuilder,
    private albumService: AlbumService,
    private artistService: ArtistService,
    private router: Router
  ) {
    this.form = this.fb.group({
      artistId: [null as number | null, Validators.required],
      title: ['', [Validators.required, Validators.maxLength(255)]],
      releaseYear: [null as number | null],
      coverImagePath: ['', Validators.maxLength(500)]
    });
  }

  get artistId() {
    return this.form.get('artistId');
  }

  get title() {
    return this.form.get('title');
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

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    const value = this.form.value;
    this.albumService.create({
      artistId: value.artistId,
      title: value.title,
      releaseYear: value.releaseYear ?? undefined,
      coverImagePath: value.coverImagePath || undefined
    }).subscribe({
      next: () => {
        this.router.navigate(['/admin/albums']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error || 'Ошибка при создании';
      }
    });
  }
}
