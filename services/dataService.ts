
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Usuario, Paciente, Sillon, Visita, Medicamento, Cita } from '../types';

const KEYS = {
  USUARIOS: '@usuarios',
  PACIENTES: '@pacientes',
  SILLONES: '@sillones',
  VISITAS: '@visitas',
  MEDICAMENTOS: '@medicamentos',
  CITAS: '@citas',
  USUARIO_ACTUAL: '@usuario_actual',
};

// Función para generar IDs únicos
const generateId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// Servicios de Usuario
export const usuarioService = {
  async inicializar(): Promise<void> {
    try {
      const usuarios = await this.obtenerTodos();
      if (usuarios.length === 0) {
        // Crear usuario por defecto
        const usuarioDefecto: Usuario = {
          id: generateId(),
          nombreUsuario: 'admin',
          contraseña: 'admin123',
          fechaCreacion: new Date().toISOString(),
        };
        await this.crear(usuarioDefecto);
        console.log('Usuario por defecto creado');
      }
    } catch (error) {
      console.error('Error al inicializar usuarios:', error);
    }
  },

  async crear(usuario: Omit<Usuario, 'id' | 'fechaCreacion'>): Promise<Usuario> {
    try {
      const nuevoUsuario: Usuario = {
        ...usuario,
        id: generateId(),
        fechaCreacion: new Date().toISOString(),
      };
      
      const usuarios = await this.obtenerTodos();
      usuarios.push(nuevoUsuario);
      await AsyncStorage.setItem(KEYS.USUARIOS, JSON.stringify(usuarios));
      return nuevoUsuario;
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw error;
    }
  },

  async obtenerTodos(): Promise<Usuario[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.USUARIOS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      return [];
    }
  },

  async autenticar(nombreUsuario: string, contraseña: string): Promise<Usuario | null> {
    try {
      const usuarios = await this.obtenerTodos();
      const usuario = usuarios.find(u => u.nombreUsuario === nombreUsuario && u.contraseña === contraseña);
      
      if (usuario) {
        await AsyncStorage.setItem(KEYS.USUARIO_ACTUAL, JSON.stringify(usuario));
        return usuario;
      }
      return null;
    } catch (error) {
      console.error('Error al autenticar usuario:', error);
      return null;
    }
  },

  async obtenerUsuarioActual(): Promise<Usuario | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.USUARIO_ACTUAL);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error al obtener usuario actual:', error);
      return null;
    }
  },

  async cerrarSesion(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.USUARIO_ACTUAL);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  },
};

// Servicios de Paciente
export const pacienteService = {
  async crear(paciente: Omit<Paciente, 'id' | 'fechaCreacion' | 'fechaActualizacion'>): Promise<Paciente> {
    try {
      const nuevoPaciente: Paciente = {
        ...paciente,
        id: generateId(),
        anotaciones: paciente.anotaciones || '',
        medicamentos: paciente.medicamentos || [],
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
      };
      
      const pacientes = await this.obtenerTodos();
      pacientes.push(nuevoPaciente);
      await AsyncStorage.setItem(KEYS.PACIENTES, JSON.stringify(pacientes));
      
      // Si se asignó un sillón, marcarlo como ocupado
      if (paciente.sillonAsignado) {
        await sillonService.marcarOcupado(paciente.sillonAsignado, nuevoPaciente.id);
      }
      
      return nuevoPaciente;
    } catch (error) {
      console.error('Error al crear paciente:', error);
      throw error;
    }
  },

  async obtenerTodos(): Promise<Paciente[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.PACIENTES);
      const pacientes = data ? JSON.parse(data) : [];
      // Migrar pacientes existentes que no tengan el campo medicamentos
      return pacientes.map((p: any) => ({
        ...p,
        medicamentos: p.medicamentos || [],
      }));
    } catch (error) {
      console.error('Error al obtener pacientes:', error);
      return [];
    }
  },

  async obtenerPorId(id: string): Promise<Paciente | null> {
    try {
      const pacientes = await this.obtenerTodos();
      return pacientes.find(p => p.id === id) || null;
    } catch (error) {
      console.error('Error al obtener paciente por ID:', error);
      return null;
    }
  },

  async actualizar(id: string, datosActualizados: Partial<Omit<Paciente, 'id' | 'fechaCreacion'>>): Promise<Paciente | null> {
    try {
      const pacientes = await this.obtenerTodos();
      const indice = pacientes.findIndex(p => p.id === id);
      
      if (indice !== -1) {
        const pacienteAnterior = pacientes[indice];
        
        pacientes[indice] = {
          ...pacientes[indice],
          ...datosActualizados,
          fechaActualizacion: new Date().toISOString(),
        };
        
        await AsyncStorage.setItem(KEYS.PACIENTES, JSON.stringify(pacientes));
        
        // Manejar cambios en la asignación de sillón
        const sillonAnterior = pacienteAnterior.sillonAsignado;
        const sillonNuevo = datosActualizados.sillonAsignado;
        
        if (sillonAnterior !== sillonNuevo) {
          // Liberar sillón anterior si existía
          if (sillonAnterior) {
            await sillonService.marcarDisponible(sillonAnterior);
          }
          
          // Ocupar nuevo sillón si se asignó
          if (sillonNuevo) {
            await sillonService.marcarOcupado(sillonNuevo, id);
          }
        }
        
        return pacientes[indice];
      }
      return null;
    } catch (error) {
      console.error('Error al actualizar paciente:', error);
      throw error;
    }
  },

  async eliminar(id: string): Promise<boolean> {
    try {
      const pacientes = await this.obtenerTodos();
      const paciente = pacientes.find(p => p.id === id);
      
      if (paciente) {
        // Liberar sillón si estaba asignado
        if (paciente.sillonAsignado) {
          await sillonService.marcarDisponible(paciente.sillonAsignado);
        }
        
        const pacientesFiltrados = pacientes.filter(p => p.id !== id);
        await AsyncStorage.setItem(KEYS.PACIENTES, JSON.stringify(pacientesFiltrados));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error al eliminar paciente:', error);
      throw error;
    }
  },
};

// Servicios de Sillón
export const sillonService = {
  async inicializar(): Promise<void> {
    try {
      const sillones = await this.obtenerTodos();
      if (sillones.length === 0) {
        // Crear sillones por defecto
        const sillonesDefecto: Omit<Sillon, 'id' | 'fechaCreacion' | 'fechaActualizacion'>[] = [
          { numero: 1, nombre: 'Sillón 1', disponible: true },
          { numero: 2, nombre: 'Sillón 2', disponible: true },
          { numero: 3, nombre: 'Sillón 3', disponible: true },
        ];
        
        for (const sillon of sillonesDefecto) {
          await this.crear(sillon);
        }
        console.log('Sillones por defecto creados');
      }
    } catch (error) {
      console.error('Error al inicializar sillones:', error);
    }
  },

  async crear(sillon: Omit<Sillon, 'id' | 'fechaCreacion' | 'fechaActualizacion'>): Promise<Sillon> {
    try {
      const nuevoSillon: Sillon = {
        ...sillon,
        id: generateId(),
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
      };
      
      const sillones = await this.obtenerTodos();
      sillones.push(nuevoSillon);
      await AsyncStorage.setItem(KEYS.SILLONES, JSON.stringify(sillones));
      return nuevoSillon;
    } catch (error) {
      console.error('Error al crear sillón:', error);
      throw error;
    }
  },

  async obtenerTodos(): Promise<Sillon[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SILLONES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error al obtener sillones:', error);
      return [];
    }
  },

  async obtenerPorId(id: string): Promise<Sillon | null> {
    try {
      const sillones = await this.obtenerTodos();
      return sillones.find(s => s.id === id) || null;
    } catch (error) {
      console.error('Error al obtener sillón por ID:', error);
      return null;
    }
  },

  async actualizar(id: string, datosActualizados: Partial<Omit<Sillon, 'id' | 'fechaCreacion'>>): Promise<Sillon | null> {
    try {
      const sillones = await this.obtenerTodos();
      const indice = sillones.findIndex(s => s.id === id);
      
      if (indice !== -1) {
        sillones[indice] = {
          ...sillones[indice],
          ...datosActualizados,
          fechaActualizacion: new Date().toISOString(),
        };
        await AsyncStorage.setItem(KEYS.SILLONES, JSON.stringify(sillones));
        return sillones[indice];
      }
      return null;
    } catch (error) {
      console.error('Error al actualizar sillón:', error);
      throw error;
    }
  },

  async eliminar(id: string): Promise<boolean> {
    try {
      const sillones = await this.obtenerTodos();
      const sillonesFiltrados = sillones.filter(s => s.id !== id);
      
      if (sillonesFiltrados.length !== sillones.length) {
        await AsyncStorage.setItem(KEYS.SILLONES, JSON.stringify(sillonesFiltrados));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error al eliminar sillón:', error);
      throw error;
    }
  },

  async obtenerDisponibles(): Promise<Sillon[]> {
    try {
      const sillones = await this.obtenerTodos();
      return sillones.filter(s => s.disponible);
    } catch (error) {
      console.error('Error al obtener sillones disponibles:', error);
      return [];
    }
  },

  async marcarOcupado(sillonId: string, pacienteId: string): Promise<void> {
    try {
      await this.actualizar(sillonId, {
        disponible: false,
        pacienteAsignado: pacienteId,
      });
    } catch (error) {
      console.error('Error al marcar sillón como ocupado:', error);
    }
  },

  async marcarDisponible(sillonId: string): Promise<void> {
    try {
      await this.actualizar(sillonId, {
        disponible: true,
        pacienteAsignado: undefined,
      });
    } catch (error) {
      console.error('Error al marcar sillón como disponible:', error);
    }
  },
};

// Servicios de Medicamento
export const medicamentoService = {
  async crear(medicamento: Omit<Medicamento, 'id' | 'fechaCreacion' | 'fechaActualizacion'>): Promise<Medicamento> {
    try {
      const nuevoMedicamento: Medicamento = {
        ...medicamento,
        id: generateId(),
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
      };
      
      const medicamentos = await this.obtenerTodos();
      medicamentos.push(nuevoMedicamento);
      await AsyncStorage.setItem(KEYS.MEDICAMENTOS, JSON.stringify(medicamentos));
      return nuevoMedicamento;
    } catch (error) {
      console.error('Error al crear medicamento:', error);
      throw error;
    }
  },

  async obtenerTodos(): Promise<Medicamento[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.MEDICAMENTOS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error al obtener medicamentos:', error);
      return [];
    }
  },

  async obtenerPorId(id: string): Promise<Medicamento | null> {
    try {
      const medicamentos = await this.obtenerTodos();
      return medicamentos.find(m => m.id === id) || null;
    } catch (error) {
      console.error('Error al obtener medicamento por ID:', error);
      return null;
    }
  },

  async actualizar(id: string, datosActualizados: Partial<Omit<Medicamento, 'id' | 'fechaCreacion'>>): Promise<Medicamento | null> {
    try {
      const medicamentos = await this.obtenerTodos();
      const indice = medicamentos.findIndex(m => m.id === id);
      
      if (indice !== -1) {
        medicamentos[indice] = {
          ...medicamentos[indice],
          ...datosActualizados,
          fechaActualizacion: new Date().toISOString(),
        };
        await AsyncStorage.setItem(KEYS.MEDICAMENTOS, JSON.stringify(medicamentos));
        return medicamentos[indice];
      }
      return null;
    } catch (error) {
      console.error('Error al actualizar medicamento:', error);
      throw error;
    }
  },

  async eliminar(id: string): Promise<boolean> {
    try {
      const medicamentos = await this.obtenerTodos();
      const medicamentosFiltrados = medicamentos.filter(m => m.id !== id);
      
      if (medicamentosFiltrados.length !== medicamentos.length) {
        await AsyncStorage.setItem(KEYS.MEDICAMENTOS, JSON.stringify(medicamentosFiltrados));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error al eliminar medicamento:', error);
      throw error;
    }
  },
};

// Servicios de Citas
export const citaService = {
  async crear(cita: Omit<Cita, 'id' | 'fechaCreacion'>): Promise<Cita> {
    try {
      const nuevaCita: Cita = {
        ...cita,
        id: generateId(),
        fechaCreacion: new Date().toISOString(),
      };
      
      const citas = await this.obtenerTodos();
      citas.push(nuevaCita);
      await AsyncStorage.setItem(KEYS.CITAS, JSON.stringify(citas));
      return nuevaCita;
    } catch (error) {
      console.error('Error al crear cita:', error);
      throw error;
    }
  },

  async obtenerTodos(): Promise<Cita[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.CITAS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error al obtener citas:', error);
      return [];
    }
  },

  async obtenerPorPaciente(pacienteId: string): Promise<Cita[]> {
    try {
      const citas = await this.obtenerTodos();
      return citas.filter(c => c.pacienteId === pacienteId);
    } catch (error) {
      console.error('Error al obtener citas por paciente:', error);
      return [];
    }
  },

  async eliminar(id: string): Promise<boolean> {
    try {
      const citas = await this.obtenerTodos();
      const citasFiltradas = citas.filter(c => c.id !== id);
      
      if (citasFiltradas.length !== citas.length) {
        await AsyncStorage.setItem(KEYS.CITAS, JSON.stringify(citasFiltradas));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error al eliminar cita:', error);
      throw error;
    }
  },
};
