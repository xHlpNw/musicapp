import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { GenreService, GenreResponse } from '../../../services/genre.service';

@Component({
  selector: 'app-genre-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './genre-form.component.html',
  styleUrls: ['./genre-form.component.css']
})
export class GenreFormComponent implements OnInit {
  form: FormGroup;
  allGenres: GenreResponse[] = [];
  errorMessage = '';
  isLoading = false;
  isEditMode = false;
  genreId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private genreService: GenreService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      parentId: [null as number | null]
    });
  }

  get name() {
    return this.form.get('name');
  }

  ngOnInit(): void {
    this.genreService.getAll().subscribe({
      next: (res) => { this.allGenres = res.content; }
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.genreId = +id;
      this.isEditMode = true;
      this.genreService.getById(this.genreId).subscribe({
        next: (genre) => {
          this.form.patchValue({
            name: genre.name,
            parentId: genre.parentId ?? null
          });
        },
        error: () => { this.errorMessage = 'Жанр не найден'; }
      });
    }
  }

  /** Рекурсивно собирает ID редактируемого жанра и всех его потомков */
  private collectDescendantIds(id: number): Set<number> {
    const excluded = new Set<number>();
    const queue = [id];
    while (queue.length) {
      const current = queue.shift()!;
      excluded.add(current);
      const node = this.allGenres.find(g => g.id === current);
      node?.childrenIds?.forEach(childId => {
        if (!excluded.has(childId)) queue.push(childId);
      });
    }
    return excluded;
  }

  /** Список жанров для select родителя — без самого себя и всех его потомков */
  get availableParents(): GenreResponse[] {
    if (!this.genreId) return this.allGenres;
    const excluded = this.collectDescendantIds(this.genreId);
    return this.allGenres.filter(g => !excluded.has(g.id));
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    const { name, parentId } = this.form.value;
    const payload = { name: name.trim(), parentId: parentId ?? null };

    if (this.isEditMode && this.genreId != null) {
      this.genreService.update(this.genreId, payload).subscribe({
        next: () => this.router.navigate(['/admin/genres']),
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.error || 'Ошибка при сохранении';
        }
      });
    } else {
      this.genreService.create(payload).subscribe({
        next: () => this.router.navigate(['/admin/genres']),
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.error || 'Ошибка при создании';
        }
      });
    }
  }
}
