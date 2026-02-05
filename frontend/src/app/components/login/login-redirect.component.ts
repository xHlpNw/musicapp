import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoginOverlayService } from '../../services/login-overlay.service';

@Component({
  selector: 'app-login-redirect',
  standalone: true,
  template: '',
  styles: []
})
export class LoginRedirectComponent implements OnInit {
  constructor(
    private router: Router,
    private loginOverlay: LoginOverlayService
  ) {}

  ngOnInit(): void {
    this.loginOverlay.open();
    this.router.navigate(['/'], { replaceUrl: true });
  }
}
