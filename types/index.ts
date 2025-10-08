
export interface Usuario {
  id: string;
  nombreUsuario: string;
  contraseña: string;
  fechaCreacion: string;
}

export interface Paciente {
  id: string;
  nombre: string;
  apellidos: string;
  fechaNacimiento: string;
  celular: string;
  correo: string;
  rut: string;
  sillonAsignado?: string;
  anotaciones: string;
  medicamentos: string[]; // Array of medication names
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface Sillon {
  id: string;
  numero: number;
  nombre: string;
  disponible: boolean;
  pacienteAsignado?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface Visita {
  id: string;
  pacienteId: string;
  sillonId: string;
  fecha: string;
  notas?: string;
  fechaCreacion: string;
}

export interface Medicamento {
  id: string;
  nombre: string;
  descripcion: string;
  cantidad: number;
  unidad: string;
  fechaVencimiento: string;
  lote?: string;
  proveedor?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface Cita {
  id: string;
  pacienteId: string;
  fecha: string;
  hora: string;
  motivo: string;
  notas?: string;
  fechaCreacion: string;
}
