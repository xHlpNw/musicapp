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
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'artists', pathMatch: 'full' },
      { path: 'artists', component: ArtistsListComponent },
      { path: 'artists/new', component: ArtistFormComponent },
      { path: 'artists/:id/edit', component: ArtistFormComponent },
      { path: 'albums', component: AlbumsListComponent },
      { path: 'albums/new', component: AlbumFormComponent }
    ]
  },
  { path: '**', redirectTo: '/' }
];
