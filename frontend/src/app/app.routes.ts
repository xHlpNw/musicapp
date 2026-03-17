import { Routes } from '@angular/router';
import { HomepageComponent } from './components/homepage/homepage.component';
import { RegisterRedirectComponent } from './components/register/register-redirect.component';
import { LoginRedirectComponent } from './components/login/login-redirect.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AdminLayoutComponent } from './components/admin/admin-layout/admin-layout.component';
import { ArtistsListComponent } from './components/admin/artists-list/artists-list.component';
import { ArtistFormComponent } from './components/admin/artist-form/artist-form.component';
import { AlbumsListComponent } from './components/admin/albums-list/albums-list.component';
import { AlbumFormComponent } from './components/admin/album-form/album-form.component';
import { TracksListComponent } from './components/admin/tracks-list/tracks-list.component';
import { TrackUploadComponent } from './components/admin/track-upload/track-upload.component';
import { TrackEditComponent } from './components/admin/track-edit/track-edit.component';
import { GenresListComponent } from './components/admin/genres-list/genres-list.component';
import { GenreFormComponent } from './components/admin/genre-form/genre-form.component';
import { ProfileComponent } from './components/profile/profile.component';
import { FavoritesComponent } from './components/favorites/favorites.component';
import { PlaylistsComponent } from './components/playlists/playlists.component';
import { PlaylistDetailComponent } from './components/playlist-detail/playlist-detail.component';
import { AlbumDetailComponent } from './components/album-detail/album-detail.component';
import { ArtistDetailComponent } from './components/artist-detail/artist-detail.component';
import { SearchComponent } from './components/search/search.component';
import { HistoryComponent } from './components/history/history.component';
import { RoomsComponent } from './components/rooms/rooms.component';
import { RoomDetailComponent } from './components/room-detail/room-detail.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', component: HomepageComponent, pathMatch: 'full' },
  { path: 'search', component: SearchComponent },
  { path: 'rooms', component: RoomsComponent },
  { path: 'rooms/:id', component: RoomDetailComponent },
  { path: 'register', component: RegisterRedirectComponent },
  { path: 'login', component: LoginRedirectComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'favorites', component: FavoritesComponent, canActivate: [authGuard] },
  { path: 'history', component: HistoryComponent, canActivate: [authGuard] },
  { path: 'playlists', component: PlaylistsComponent },
  { path: 'playlists/:id', component: PlaylistDetailComponent },
  { path: 'album/:id', component: AlbumDetailComponent },
  { path: 'artist/:id', component: ArtistDetailComponent },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', redirectTo: 'artists', pathMatch: 'full' },
      { path: 'artists', component: ArtistsListComponent },
      { path: 'artists/new', component: ArtistFormComponent },
      { path: 'artists/:id/edit', component: ArtistFormComponent },
      { path: 'albums', component: AlbumsListComponent },
      { path: 'albums/new', component: AlbumFormComponent },
      { path: 'albums/:id/edit', component: AlbumFormComponent },
      { path: 'tracks', component: TracksListComponent },
      { path: 'tracks/new', component: TrackUploadComponent },
      { path: 'tracks/:id/edit', component: TrackEditComponent },
      { path: 'genres', component: GenresListComponent },
      { path: 'genres/new', component: GenreFormComponent },
      { path: 'genres/:id/edit', component: GenreFormComponent }
    ]
  },
  { path: '**', redirectTo: '/' }
];
