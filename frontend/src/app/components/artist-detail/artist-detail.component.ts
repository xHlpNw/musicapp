import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { ArtistService } from '../../services/artist.service';
import { FavoritesService } from '../../services/favorites.service';
import { AuthService } from '../../services/auth.service';
import { LoginOverlayService } from '../../services/login-overlay.service';
import { PlayerService } from '../../services/player.service';
import { GenreService } from '../../services/genre.service';
import { ArtistResponse } from '../../models/artist.model';
import { LoginResponse } from '../../models/auth.model';
import { SideNavComponent } from '../side-nav/side-nav.component';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { switchMap, takeUntil, filter } from 'rxjs/operators';
import { of, Subject } from 'rxjs';

@Component({
  selector: 'app-artist-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, SideNavComponent, AppHeaderComponent],
  templateUrl: './artist-detail.component.html',
  styleUrls: ['./artist-detail.component.css']
})
export class ArtistDetailComponent implements OnInit, OnDestroy {
  artist: ArtistResponse | null = null;
  isLoading = true;
  error = '';
  hasActiveTrack = false;
  currentUser: LoginResponse | null = null;
  isFavorite = false;
  private favoriteArtistIds = new Set<number>();
  private genreMap = new Map<number, string>();
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private artistService: ArtistService,
    private favoritesService: FavoritesService,
    private genreService: GenreService,
    public authService: AuthService,
    public playerService: PlayerService,
    private loginOverlay: LoginOverlayService,
    private sanitizer: DomSanitizer
  ) {}

  openLogin(event: Event): void {
    event.preventDefault();
    this.loginOverlay.open();
  }

  ngOnInit(): void {
    this.genreService.getAll().subscribe({
      next: (res) => res.content.forEach(g => this.genreMap.set(g.id, g.name))
    });
    this.authService.currentUser$.subscribe(u => this.currentUser = u);
    this.playerService.currentTrack$.subscribe(t => this.hasActiveTrack = !!t);
    if (this.authService.isAuthenticated()) {
      this.loadFavoriteIds();
    }
    this.favoritesService.favoritesChanged$.pipe(
      takeUntil(this.destroy$),
      filter(kind => kind === 'artists')
    ).subscribe(() => this.loadFavoriteIds());
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (!id) return of(null);
        const numId = +id;
        if (Number.isNaN(numId)) return of(null);
        this.isLoading = true;
        this.error = '';
        return this.artistService.getById(numId);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (artist) => {
        if (!artist) {
          this.router.navigate(['/']);
          return;
        }
        this.artist = artist;
        this.isFavorite = this.favoriteArtistIds.has(artist.id);
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Исполнитель не найден';
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadFavoriteIds(): void {
    this.favoritesService.getArtists().subscribe({
      next: (list) => {
        this.favoriteArtistIds = new Set(list.map(a => a.id));
        if (this.artist) this.isFavorite = this.favoriteArtistIds.has(this.artist.id);
      }
    });
  }

  isHeartActive(): boolean {
    return this.isFavorite;
  }

  toggleFavorite(event: Event): void {
    event.stopPropagation();
    if (!this.artist) return;
    if (!this.authService.isAuthenticated()) {
      this.openLogin(event);
      return;
    }
    if (this.isFavorite) {
      this.favoritesService.removeArtist(this.artist.id).subscribe({
        next: () => {
          this.favoriteArtistIds.delete(this.artist!.id);
          this.isFavorite = false;
        }
      });
    } else {
      this.favoritesService.addArtist(this.artist.id).subscribe({
        next: () => {
          this.favoriteArtistIds.add(this.artist!.id);
          this.isFavorite = true;
        }
      });
    }
  }

  getGenreNames(): string[] {
    if (!this.artist?.genreIds?.length) return [];
    return [...this.artist.genreIds]
      .map(id => this.genreMap.get(id))
      .filter((n): n is string => !!n);
  }

  getAlbumCount(): number {
    return this.artist?.albums?.length ?? 0;
  }

  getAlbumsWord(count: number): string {
    if (count === 1) return 'альбом';
    if (count >= 2 && count <= 4) return 'альбома';
    return 'альбомов';
  }

  getCoversUrl(path: string | undefined): string | null {
    if (!path) return null;
    return '/api/covers/' + path;
  }

  getCoverStyle(path: string | undefined): SafeStyle | null {
    const url = this.getCoversUrl(path);
    return url ? this.sanitizer.bypassSecurityTrustStyle('url(' + url + ')') : null;
  }

  getArtistInitial(): string {
    const name = this.artist?.name?.trim();
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  getAvatarUrl(user: LoginResponse): string | null {
    if (!user?.avatarUrl) return null;
    const base = user.avatarUrl.startsWith('http') ? user.avatarUrl : '/api/covers/' + user.avatarUrl;
    const sep = base.includes('?') ? '&' : '?';
    return user.avatarVersion ? `${base}${sep}v=${user.avatarVersion}` : base;
  }

  getInitial(user: LoginResponse): string {
    return user?.username?.charAt(0)?.toUpperCase() ?? '?';
  }
}
