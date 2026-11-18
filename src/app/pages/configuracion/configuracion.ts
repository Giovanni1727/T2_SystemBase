import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navar } from '../../componentes/navar/navar';
import { ConfiguracionService } from '../../servicios/configuracion.service/configuracion.service';
import { Empresa } from '../../modelos/empresa/empresa';
import { Usuario } from '../../modelos/usuario/usuario';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule, Navar],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.scss',
})
export class Configuracion implements OnInit {
  private configService = inject(ConfiguracionService);

  
  empresas = signal<Empresa[]>([]);
  usuarios = signal<Usuario[]>([]); 
  mensajeEmpresa = signal<string>('');
  mensajeUsuario = signal<string>('');

  
  nuevaEmpresa: Empresa = { nombre: '', ruc: '' };

  
  nuevoUsuario = {
    correo: '',
    password: '',
    rol: 'CLIENTE',
    empresa: { id: null } as any
  };

  ngOnInit() {
    this.cargarEmpresas();
    this.cargarUsuarios(); 
  }

  cargarEmpresas() {
    this.configService.listarEmpresas().subscribe({
      next: (data) => this.empresas.set(data),
      error: (err) => console.error('Error al cargar empresas', err)
    });
  }

  
  cargarUsuarios() {
    this.configService.listarUsuarios().subscribe({
      next: (data) => this.usuarios.set(data),
      error: (err) => console.error('Error al cargar usuarios', err)
    });
  }

  guardarEmpresa() {
    this.mensajeEmpresa.set('');
    if (!this.nuevaEmpresa.nombre || !this.nuevaEmpresa.ruc) {
      this.mensajeEmpresa.set('Por favor completa todos los campos de la empresa.');
      return;
    }

    this.configService.registrarEmpresa(this.nuevaEmpresa).subscribe({
      next: () => {
        this.mensajeEmpresa.set('¡Empresa registrada con éxito!');
        this.nuevaEmpresa = { nombre: '', ruc: '' };
        this.cargarEmpresas();
      },
      error: () => this.mensajeEmpresa.set('Error al registrar la empresa.')
    });
  }

  guardarUsuarioCliente() {
    this.mensajeUsuario.set('');
    if (!this.nuevoUsuario.correo || !this.nuevoUsuario.password || !this.nuevoUsuario.empresa.id) {
      this.mensajeUsuario.set('Completa todos los campos y selecciona una empresa.');
      return;
    }

    this.configService.registrarUsuarioCliente(this.nuevoUsuario).subscribe({
      next: () => {
        this.mensajeUsuario.set('¡Usuario cliente creado correctamente!');
        this.nuevoUsuario = { correo: '', password: '', rol: 'CLIENTE', empresa: { id: null } };
        this.cargarUsuarios(); 
      },
      error: () => this.mensajeUsuario.set('Error al registrar el usuario (el correo podría estar duplicado).')
    });
  }
}