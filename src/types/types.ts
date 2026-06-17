// src/types/types.ts

// Módulo de Martín (CRUD Usuarios)
export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  password?: string;
  telefono: string;
  rol: 'Administrador' | 'Cliente';
  activo: boolean; 
}

// Módulo de Luis (CRUD Proyectos y Noticias)
export interface Proyecto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagenes: string[]; 
  categoria: string;
  disponible: boolean;
}

export interface Noticia {
  id: string;
  titulo: string;
  contenido: string;
  imagenes: string[];
  fecha: string;
  autor: string;
  proyectoRelacionado?: string; 
}

// Módulo de Martina (CRUD Cotizaciones)
export interface Cotizacion {
  id: string;
  estado: 'Pendiente' | 'En revisión' | 'Contactado' | 'Finalizado' | 'Cancelado';
  nombreCliente: string;
  rutCliente: string;
  fecha: string;
  descripcion: string;
  responsableId?: string; 
}