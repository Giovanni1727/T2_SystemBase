import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Empresa } from '../../modelos/empresa/empresa';
import { Usuario } from '../../modelos/usuario/usuario';

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionService {
  private http = inject(HttpClient);
  private urlEmpresas = 'http://localhost:8081/api/empresas';
  private urlAuth = 'http://localhost:8081/api/auth';

  listarEmpresas(): Observable<Empresa[]> {
    return this.http.get<Empresa[]>(this.urlEmpresas);
  }

  registrarEmpresa(empresa: Empresa): Observable<Empresa> {
    return this.http.post<Empresa>(this.urlEmpresas, empresa);
  }

  
  listarUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.urlAuth}/usuarios`);
  }

  registrarUsuarioCliente(usuario: any): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.urlAuth}/registro`, usuario);
  }
}