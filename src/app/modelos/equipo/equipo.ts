import { Empresa } from "../empresa/empresa";

export interface Equipo {
    id?: number;
    serie: string;
    tipo: string;
    modelo: string;
    empresa: Empresa;
    
    procesador?: string;
    ram?: string;
    disco?: string;
    tamano?: string;
    compatibilidad?: string;
    interfaz?: string;

    fechaInicioAlquiler?: string | null;
    mesesAlquiler?: number | null;
}