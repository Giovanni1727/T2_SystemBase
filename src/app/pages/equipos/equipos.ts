import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navar } from '../../componentes/navar/navar';
import { EquipoService } from '../../servicios/equipo.service/equipo.service';
import { AuthService } from '../../servicios/auth.service/auth.service';
import { ConfiguracionService } from '../../servicios/configuracion.service/configuracion.service';
import { Equipo } from '../../modelos/equipo/equipo';
import { Empresa } from '../../modelos/empresa/empresa';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
    fechaFinAlquiler: this.obtenerFechaMasMeses(this.obtenerFechaHoy(), 1),
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

  equiposParaExportar = computed(() => {
    const busqueda = this.terminoBusqueda().toLowerCase().trim();
    const idEmpresaSel = this.empresaFiltro();
    let filtrados = this.equipos();

    if (idEmpresaSel !== '') {
      filtrados = filtrados.filter(e => e.empresa?.id === Number(idEmpresaSel));
    }
    if (busqueda) {
      filtrados = filtrados.filter(e => e.serie.toLowerCase().includes(busqueda));
    }

    return filtrados;
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

  obtenerFechaMasMeses(fechaBase: string, meses: number): string {
    const [anio, mes, dia] = fechaBase.split('-').map(Number);
    const fecha = new Date(anio, (mes - 1) + meses, dia);
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
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

    let fechaFin: Date | null = null;

    if (eq.fechaFinAlquiler) {
      const [anio, mes, dia] = eq.fechaFinAlquiler.split('-').map(Number);
      fechaFin = new Date(anio, mes - 1, dia);
    } else if (eq.fechaInicioAlquiler && eq.mesesAlquiler) {
      const [anio, mes, dia] = eq.fechaInicioAlquiler.split('-').map(Number);
      fechaFin = new Date(anio, (mes - 1) + Number(eq.mesesAlquiler), dia);
    }

    if (!fechaFin) {
      return { texto: 'Sin plazo definido', clase: 'bg-secondary' };
    }

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
    return { texto: `${diasRestantes} días restantes`, clase: 'bg-primary' };
  }

  limpiarFiltros() {
    this.terminoBusqueda.set('');
    this.empresaFiltro.set('');
    this.paginaActual.set(1);
  }

  abrirModalCrear() {
    this.esEdicion.set(false);
    this.mensajeModal.set('');
    const hoy = this.obtenerFechaHoy();
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
      fechaInicioAlquiler: hoy,
      fechaFinAlquiler: this.obtenerFechaMasMeses(hoy, 1),
      mesesAlquiler: 1
    };
  }

  abrirModalEditar(equipo: Equipo) {
    this.esEdicion.set(true);
    this.mensajeModal.set('');
    const fechaInicio = equipo.fechaInicioAlquiler || this.obtenerFechaHoy();
    const fechaFin = equipo.fechaFinAlquiler
      || (equipo.mesesAlquiler ? this.obtenerFechaMasMeses(fechaInicio, equipo.mesesAlquiler) : this.obtenerFechaMasMeses(fechaInicio, 1));

    this.nuevoEquipo = {
      ...equipo,
      empresa: { ...equipo.empresa },
      fechaInicioAlquiler: fechaInicio,
      fechaFinAlquiler: fechaFin,
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
      this.nuevoEquipo.fechaFinAlquiler = null;
      this.nuevoEquipo.mesesAlquiler = null;
    } else {
      if (!this.nuevoEquipo.fechaInicioAlquiler || !this.nuevoEquipo.fechaFinAlquiler) {
        this.mensajeModal.set('Indica la fecha de inicio y la fecha de fin de alquiler.');
        return;
      }
      if (this.nuevoEquipo.fechaFinAlquiler < this.nuevoEquipo.fechaInicioAlquiler) {
        this.mensajeModal.set('La fecha de fin no puede ser anterior a la fecha de inicio.');
        return;
      }
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
      const bs = (window as any).bootstrap;
      if (bs?.Modal) {
        const instancia = bs.Modal.getInstance(modalEl) || bs.Modal.getOrCreateInstance(modalEl);
        instancia.hide();
        return;
      }

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

  private obtenerDetallesTexto(eq: Equipo): string {
    const partes: string[] = [];
    if (eq.procesador) partes.push(`Proc: ${eq.procesador}`);
    if (eq.ram) partes.push(`RAM: ${eq.ram}`);
    if (eq.disco) partes.push(`Disco: ${eq.disco}`);
    if (eq.tamano) partes.push(`Tamaño: ${eq.tamano}`);
    if (eq.compatibilidad) partes.push(`Compat: ${eq.compatibilidad}`);
    if (eq.interfaz) partes.push(`Interfaz: ${eq.interfaz}`);
    return partes.join(' | ');
  }

  private obtenerEtiquetaEmpresaFiltro(): string {
    const idSel = this.empresaFiltro();
    if (idSel === '') {
      return 'Todas_las_empresas';
    }
    const emp = this.empresas().find(e => e.id === Number(idSel));
    return (emp?.nombre || `Empresa_${idSel}`).replace(/\s+/g, '_');
  }

  private obtenerNombreArchivoExport(extension: 'xlsx' | 'pdf'): string {
    const empresaSlug = this.obtenerEtiquetaEmpresaFiltro();
    const fecha = new Date().toISOString().slice(0, 10);
    return `Inventario_SystemBase_${empresaSlug}_${fecha}.${extension}`;
  }

  exportarExcel(): void {
    const lista = this.equiposParaExportar();
    if (lista.length === 0) {
      alert('No hay equipos visibles con los filtros actuales para exportar.');
      return;
    }

    const filas = lista.map(eq => ({
      'Serie': eq.serie,
      'Tipo': eq.tipo,
      'Modelo': eq.modelo,
      'Empresa Propietaria': eq.empresa?.nombre || '',
      'Tiempo alquiler': this.obtenerInfoAlquiler(eq).texto,
      'Detalles Específicos': this.obtenerDetallesTexto(eq)
    }));

    const hoja = XLSX.utils.json_to_sheet(filas);
    hoja['!cols'] = [
      { wch: 16 },
      { wch: 14 },
      { wch: 22 },
      { wch: 24 },
      { wch: 28 },
      { wch: 50 }
    ];

    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Inventario');
    XLSX.writeFile(libro, this.obtenerNombreArchivoExport('xlsx'));
  }

  exportarPDF(): void {
    const lista = this.equiposParaExportar();
    if (lista.length === 0) {
      alert('No hay equipos visibles con los filtros actuales para exportar.');
      return;
    }

    const idSel = this.empresaFiltro();
    const nombreEmpresa = idSel === ''
      ? 'Todas las empresas'
      : (this.empresas().find(e => e.id === Number(idSel))?.nombre || 'Empresa seleccionada');
    const fechaHoy = new Date().toLocaleDateString('es-PE');

    const doc = new jsPDF({ orientation: 'landscape' });

    doc.setFontSize(14);
    doc.text('Inventario de Equipos TI - SystemBase PE', 14, 15);

    doc.setFontSize(10);
    doc.setTextColor(90);
    doc.text(`Empresa: ${nombreEmpresa}   |   Fecha: ${fechaHoy}   |   Equipos: ${lista.length}`, 14, 22);

    autoTable(doc, {
      startY: 27,
      head: [['Serie', 'Tipo', 'Modelo', 'Empresa Propietaria', 'Tiempo alquiler', 'Detalles Específicos']],
      body: lista.map(eq => [
        eq.serie,
        eq.tipo,
        eq.modelo,
        eq.empresa?.nombre || '',
        this.obtenerInfoAlquiler(eq).texto,
        this.obtenerDetallesTexto(eq)
      ]),
      styles: { fontSize: 8.5, cellPadding: 3 },
      headStyles: { fillColor: [23, 59, 112], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    doc.save(this.obtenerNombreArchivoExport('pdf'));
  }
}