import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Equipo } from '../../modelos/equipo/equipo';

@Injectable({
  providedIn: 'root'
})
export class EquipoService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8081/api/equipos';

  listarTodos(): Observable<Equipo[]> {
    return this.http.get<Equipo[]>(this.apiUrl);
  }

  listarPorEmpresa(empresaId: number): Observable<Equipo[]> {
    return this.http.get<Equipo[]>(`${this.apiUrl}/empresa/${empresaId}`);
  }

  guardar(equipo: Equipo): Observable<Equipo> {
    return this.http.post<Equipo>(this.apiUrl, equipo);
  }

  eliminarPorSerie(serie: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/serie/${serie}`);
  }

  actualizar(id: number, equipo: Equipo): Observable<Equipo> {
    return this.http.put<Equipo>(`${this.apiUrl}/${id}`, equipo);
  }
}