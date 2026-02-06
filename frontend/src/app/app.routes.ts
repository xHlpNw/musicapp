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
import { ProfileComponent } from './components/profile/profile.component';
import { FavoritesComponent } from './components/favorites/favorites.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomepageComponent, pathMatch: 'full' },
  { path: 'register', component: RegisterRedirectComponent },
  { path: 'login', component: LoginRedirectComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'favorites', component: FavoritesComponent, canActivate: [authGuard] },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'artists', pathMatch: 'full' },
      { path: 'artists', component: ArtistsListComponent },
      { path: 'artists/new', component: ArtistFormComponent },
      { path: 'albums', component: AlbumsListComponent },
      { path: 'albums/new', component: AlbumFormComponent },
      { path: 'tracks', component: TracksListComponent },
      { path: 'tracks/new', component: TrackUploadComponent }
    ]
  },
  { path: '**', redirectTo: '/' }
];
