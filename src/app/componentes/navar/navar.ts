import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../servicios/auth.service/auth.service';

@Component({
  selector: 'app-navar',
  standalone: true,
  imports: [RouterModule], 
  templateUrl: './navar.html',
  styleUrl: './navar.scss',
})
export class Navar implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

 
  rol = signal<string>('');

  ngOnInit() {
    
    this.rol.set(this.authService.getRol() || '');
  }

  cerrarSesion() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}