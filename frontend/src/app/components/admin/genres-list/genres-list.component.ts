import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GenreService, GenreResponse } from '../../../services/genre.service';

@Component({
  selector: 'app-genres-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './genres-list.component.html',
  styleUrls: ['./genres-list.component.css']
})
export class GenresListComponent implements OnInit {
  genres: GenreResponse[] = [];
  allGenres: GenreResponse[] = [];
  totalElements = 0;
  totalPages = 0;
  currentPage = 0;
  size = 20;
  searchQuery = '';
  isLoading = false;
  errorMessage = '';
  deletingId: number | null = null;

  constructor(private genreService: GenreService) {}

  ngOnInit(): void {
    this.genreService.getAll().subscribe({
      next: (res) => { this.allGenres = res.content; }
    });
    this.loadPage();
  }

  loadPage(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.genreService.getPage(this.currentPage, this.size, this.searchQuery || undefined).subscribe({
      next: (res) => {
        this.genres = res.content;
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

  getParentName(parentId: number | null | undefined): string {
    if (!parentId) return '—';
    const parent = this.allGenres.find(g => g.id === parentId);
    return parent ? parent.name : `#${parentId}`;
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadPage();
  }

  onDelete(genre: GenreResponse): void {
    if (!confirm(`Удалить жанр «${genre.name}»?`)) return;
    this.deletingId = genre.id;
    this.genreService.delete(genre.id).subscribe({
      next: () => {
        this.deletingId = null;
        this.loadPage();
      },
      error: () => {
        this.deletingId = null;
        this.errorMessage = 'Не удалось удалить жанр';
      }
    });
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
}
