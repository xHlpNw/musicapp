import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ArtistService } from '../../../services/artist.service';

@Component({
  selector: 'app-artist-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './artist-form.component.html',
  styleUrls: ['./artist-form.component.css']
})
export class ArtistFormComponent {
  form: FormGroup;
  errorMessage = '';
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private artistService: ArtistService,
    private router: Router
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      description: ['', Validators.maxLength(2000)],
      coverImagePath: ['', Validators.maxLength(500)]
    });
  }

  get name() {
    return this.form.get('name');
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    const value = this.form.value;
    this.artistService.create({
      name: value.name,
      description: value.description || undefined,
      coverImagePath: value.coverImagePath || undefined
    }).subscribe({
      next: () => {
        this.router.navigate(['/admin/artists']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error || 'Ошибка при создании';
      }
    });
  }
}
