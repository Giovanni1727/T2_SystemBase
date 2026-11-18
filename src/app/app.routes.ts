import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Equipos } from './pages/equipos/equipos';
import { Configuracion } from './pages/configuracion/configuracion';
import { authGuard } from './servicios/auth.guard/auth.guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  
  // Rutas protegidas con el Guard
  { 
    path: 'equipos', 
    component: Equipos, 
    canActivate: [authGuard] 
  },
  { 
    path: 'configuracion', 
    component: Configuracion, 
    canActivate: [authGuard] 
  },
  
  // Redirección por defecto si escriben cualquier otra cosa o la raíz
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];