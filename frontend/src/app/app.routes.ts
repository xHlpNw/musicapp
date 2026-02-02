import { Routes } from '@angular/router';
import { RegisterComponent } from './components/register/register.component';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AdminLayoutComponent } from './components/admin/admin-layout/admin-layout.component';
import { ArtistsListComponent } from './components/admin/artists-list/artists-list.component';
import { ArtistFormComponent } from './components/admin/artist-form/artist-form.component';
import { AlbumsListComponent } from './components/admin/albums-list/albums-list.component';
import { AlbumFormComponent } from './components/admin/album-form/album-form.component';
import { TracksListComponent } from './components/admin/tracks-list/tracks-list.component';
import { TrackUploadComponent } from './components/admin/track-upload/track-upload.component';
import { HomeComponent } from './components/home/home.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/register', pathMatch: 'full' },
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
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
  { path: '**', redirectTo: '/register' }
];
