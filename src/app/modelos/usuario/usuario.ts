import { Empresa } from '../empresa/empresa';

export interface Usuario {
  id?: number;
  correo: string;
  password?: string; 
  rol: string;
  empresa?: Empresa; 
}