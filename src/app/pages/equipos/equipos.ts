import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navar } from '../../componentes/navar/navar';
import { EquipoService } from '../../servicios/equipo.service/equipo.service';
import { AuthService } from '../../servicios/auth.service/auth.service';
import { ConfiguracionService } from '../../servicios/configuracion.service/configuracion.service';
import { Equipo } from '../../modelos/equipo/equipo';
import { Empresa } from '../../modelos/empresa/empresa';

@Component({
  selector: 'app-equipos',
  standalone: true,
  imports: [CommonModule, FormsModule, Navar],
  templateUrl: './equipos.html',
  styleUrl: './equipos.scss',
})
export class Equipos implements OnInit {
  private equipoService = inject(EquipoService);
  private authService = inject(AuthService);
  private configService = inject(ConfiguracionService);

  rol = signal<string>('');
  equipos = signal<Equipo[]>([]);
  empresas = signal<Empresa[]>([]);
  terminoBusqueda = signal<string>('');
  empresaFiltro = signal<number | ''>('');

  mensajeModal = signal<string>('');
  esEdicion = signal<boolean>(false);

  paginaActual = signal<number>(1);
  itemsPorPagina = 20;

  nuevoEquipo: Equipo = {
    serie: '',
    tipo: 'Laptop',
    modelo: '',
    empresa: { id: 0, nombre: '', ruc: '' },
    procesador: '',
    ram: '',
    disco: '',
    tamano: '',
    compatibilidad: '',
    interfaz: '',
    fechaInicioAlquiler: this.obtenerFechaHoy(),
    mesesAlquiler: 1
  };

  equiposFiltrados = computed(() => {
    const busqueda = this.terminoBusqueda().toLowerCase();
    const idEmpresaSel = this.empresaFiltro();
    let filtrados = this.equipos();

    if (idEmpresaSel !== '') {
      filtrados = filtrados.filter(e => e.empresa?.id === Number(idEmpresaSel));
    }

    if (busqueda) {
      filtrados = filtrados.filter(e => e.serie.toLowerCase().includes(busqueda));
    }

    const inicio = (this.paginaActual() - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return filtrados.slice(inicio, fin);
  });

  totalPaginas = computed(() => {
    const busqueda = this.terminoBusqueda().toLowerCase();
    const idEmpresaSel = this.empresaFiltro();
    let filtrados = this.equipos();

    if (idEmpresaSel !== '') {
      filtrados = filtrados.filter(e => e.empresa?.id === Number(idEmpresaSel));
    }
    if (busqueda) {
      filtrados = filtrados.filter(e => e.serie.toLowerCase().includes(busqueda));
    }

    return Math.ceil(filtrados.length / this.itemsPorPagina) || 1;
  });

  ngOnInit() {
    this.rol.set(this.authService.getRol() || '');
    this.cargarDatos();
  }

  cargarDatos() {
    const rolActual = this.rol();
    const empresaId = this.authService.getEmpresaId();

    if (rolActual === 'ADMIN') {
      this.equipoService.listarTodos().subscribe({
        next: (data) => this.equipos.set(data),
        error: (err) => console.error('Error cargando equipos', err)
      });
      this.configService.listarEmpresas().subscribe({
        next: (data) => this.empresas.set(data)
      });
    } else if (rolActual === 'CLIENTE' && empresaId) {
      this.equipoService.listarPorEmpresa(empresaId).subscribe({
        next: (data) => this.equipos.set(data),
        error: (err) => console.error('Error cargando equipos de cliente', err)
      });
    }
  }

  obtenerFechaHoy(): string {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  esEmpresaSystemBase(empresaId: number | null | undefined): boolean {
    if (!empresaId) return false;
    const emp = this.empresas().find(e => e.id === Number(empresaId));
    return emp?.ruc === '00000000000';
  }

  obtenerInfoAlquiler(eq: Equipo): { texto: string; clase: string } {
    if (!eq.empresa || eq.empresa.ruc === '00000000000') {
      return { texto: 'Disponible para alquiler', clase: 'bg-success' };
    }

    if (!eq.fechaInicioAlquiler || !eq.mesesAlquiler) {
      return { texto: 'Sin plazo definido', clase: 'bg-secondary' };
    }

    const [anio, mes, dia] = eq.fechaInicioAlquiler.split('-').map(Number);
    const fechaFin = new Date(anio, (mes - 1) + Number(eq.mesesAlquiler), dia);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fechaFin.setHours(0, 0, 0, 0);

    const diffMs = fechaFin.getTime() - hoy.getTime();
    const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diasRestantes < 0) {
      return { texto: `Vencido (hace ${Math.abs(diasRestantes)} días)`, clase: 'bg-danger' };
    }
    if (diasRestantes === 0) {
      return { texto: 'Vence hoy', clase: 'bg-warning text-dark' };
    }
    if (diasRestantes <= 5) {
      return { texto: `${diasRestantes} días (Por vencer)`, clase: 'bg-warning text-dark' };
    }
    return { texto: `${diasRestantes} días (${eq.mesesAlquiler} mes/es)`, clase: 'bg-primary' };
  }

  limpiarFiltros() {
    this.terminoBusqueda.set('');
    this.empresaFiltro.set('');
    this.paginaActual.set(1);
  }

  abrirModalCrear() {
    this.esEdicion.set(false);
    this.mensajeModal.set('');
    this.nuevoEquipo = {
      serie: '',
      tipo: 'Laptop',
      modelo: '',
      empresa: { id: 0, nombre: '', ruc: '' },
      procesador: '',
      ram: '',
      disco: '',
      tamano: '',
      compatibilidad: '',
      interfaz: '',
      fechaInicioAlquiler: this.obtenerFechaHoy(),
      mesesAlquiler: 1
    };
  }

  abrirModalEditar(equipo: Equipo) {
    this.esEdicion.set(true);
    this.mensajeModal.set('');
    this.nuevoEquipo = {
      ...equipo,
      empresa: { ...equipo.empresa },
      fechaInicioAlquiler: equipo.fechaInicioAlquiler || this.obtenerFechaHoy(),
      mesesAlquiler: equipo.mesesAlquiler ?? 1
    };
  }

  guardarEquipo() {
    this.mensajeModal.set('');
    if (!this.nuevoEquipo.serie || !this.nuevoEquipo.modelo || !this.nuevoEquipo.empresa.id) {
      this.mensajeModal.set('Por favor completa la Serie, el Modelo y la Empresa.');
      return;
    }

    if (this.esEmpresaSystemBase(this.nuevoEquipo.empresa.id)) {
      this.nuevoEquipo.fechaInicioAlquiler = null;
      this.nuevoEquipo.mesesAlquiler = null;
    } else if (!this.nuevoEquipo.fechaInicioAlquiler || !this.nuevoEquipo.mesesAlquiler || this.nuevoEquipo.mesesAlquiler < 1) {
      this.mensajeModal.set('Indica la fecha de inicio y los meses de alquiler para la empresa cliente.');
      return;
    }

    if (this.esEdicion() && this.nuevoEquipo.id) {
      this.equipoService.actualizar(this.nuevoEquipo.id, this.nuevoEquipo).subscribe({
        next: () => this.cerrarModalYActualizar(),
        error: () => this.mensajeModal.set('Error al actualizar el equipo.')
      });
    } else {
      this.equipoService.guardar(this.nuevoEquipo).subscribe({
        next: () => this.cerrarModalYActualizar(),
        error: () => this.mensajeModal.set('Error al registrar. Verifica que el número de serie no esté duplicado.')
      });
    }
  }

  cerrarModalYActualizar() {
    this.cargarDatos();
    const modalEl = document.getElementById('modalEquipo');
    if (modalEl) {
      document.body.classList.remove('modal-open');
      const backdrop = document.getElementsByClassName('modal-backdrop')[0];
      if (backdrop) backdrop.remove();
      modalEl.classList.remove('show');
      modalEl.style.display = 'none';
    }
  }

  eliminarEquipo(serie: string) {
    if (confirm(`¿Estás seguro de eliminar el equipo con serie: ${serie}?`)) {
      this.equipoService.eliminarPorSerie(serie).subscribe({
        next: () => this.cargarDatos(),
        error: () => alert('No se pudo eliminar el equipo.')
      });
    }
  }

  cambiarPagina(delta: number) {
    const nueva = this.paginaActual() + delta;
    if (nueva >= 1 && nueva <= this.totalPaginas()) {
      this.paginaActual.set(nueva);
    }
  }

  irAPagina(pagina: number) {
    this.paginaActual.set(pagina);
  }
}