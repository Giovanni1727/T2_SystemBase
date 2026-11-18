import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Equipos } from './pages/equipos/equipos';
import { Configuracion } from './pages/configuracion/configuracion';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: Login
  },
  {
    path: 'equipos',
    component: Equipos
  },
  {
    path: 'configuracion',
    component: Configuracion
  },
  {
    path: '**',
    redirectTo: 'login' // Si pone una URL que no existe, lo devuelve al login
  }
];