import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RegisterOverlayService } from '../../services/register-overlay.service';

@Component({
  selector: 'app-register-redirect',
  standalone: true,
  template: '',
  styles: []
})
export class RegisterRedirectComponent implements OnInit {
  constructor(
    private router: Router,
    private registerOverlay: RegisterOverlayService
  ) {}

  ngOnInit(): void {
    this.registerOverlay.open();
    this.router.navigate(['/'], { replaceUrl: true });
  }
}
