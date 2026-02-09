import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { ArtistService } from '../../services/artist.service';
import { AuthService } from '../../services/auth.service';
import { LoginOverlayService } from '../../services/login-overlay.service';
import { PlayerService } from '../../services/player.service';
import { ArtistResponse } from '../../models/artist.model';
import { LoginResponse } from '../../models/auth.model';
import { SideNavComponent } from '../side-nav/side-nav.component';
import { switchMap, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';

@Component({
  selector: 'app-artist-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, SideNavComponent],
  templateUrl: './artist-detail.component.html',
  styleUrls: ['./artist-detail.component.css']
})
export class ArtistDetailComponent implements OnInit, OnDestroy {
  artist: ArtistResponse | null = null;
  isLoading = true;
  error = '';
  hasActiveTrack = false;
  currentUser: LoginResponse | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private artistService: ArtistService,
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
    this.authService.currentUser$.subscribe(u => this.currentUser = u);
    this.playerService.currentTrack$.subscribe(t => this.hasActiveTrack = !!t);
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
