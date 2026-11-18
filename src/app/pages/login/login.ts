import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../servicios/auth.service/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  correo: string = '';
  password: string = '';
  mensaje: string = '';

  
  private authService = inject(AuthService);
  private router = inject(Router);

  iniciarSesion(): void {
    this.mensaje = '';

    if (!this.correo.trim() || !this.password.trim()) {
      this.mensaje = 'Ingresa tu correo y contraseña.';
      return;
    }

    // Consumimos el backend real
    this.authService.login(this.correo, this.password).subscribe({
      next: (respuesta) => {
        
        this.router.navigate(['/equipos']);
      },
      error: (err) => {
        
        this.mensaje = 'Credenciales incorrectas. Inténtalo de nuevo.';
      }
    });
  }
}