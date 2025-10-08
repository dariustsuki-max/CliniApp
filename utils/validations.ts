
// Validaciones para datos chilenos

/**
 * Valida un RUT chileno
 * @param rut - RUT en formato 12345678-9 o 12.345.678-9
 * @returns boolean - true si el RUT es válido
 */
export const validarRUT = (rut: string): boolean => {
  if (!rut) return false;
  
  // Limpiar el RUT (remover puntos, guiones y espacios)
  const rutLimpio = rut.replace(/[.-\s]/g, '').toUpperCase();
  
  // Verificar que tenga entre 8 y 9 caracteres
  if (rutLimpio.length < 8 || rutLimpio.length > 9) return false;
  
  // Separar número y dígito verificador
  const numero = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1);
  
  // Verificar que el número sea numérico
  if (!/^\d+$/.test(numero)) return false;
  
  // Calcular dígito verificador
  let suma = 0;
  let multiplicador = 2;
  
  for (let i = numero.length - 1; i >= 0; i--) {
    suma += parseInt(numero[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  
  const resto = suma % 11;
  const dvCalculado = resto === 0 ? '0' : resto === 1 ? 'K' : (11 - resto).toString();
  
  return dv === dvCalculado;
};

/**
 * Formatea un RUT chileno
 * @param rut - RUT sin formato
 * @returns string - RUT formateado (12.345.678-9)
 */
export const formatearRUT = (rut: string): string => {
  if (!rut) return '';
  
  const rutLimpio = rut.replace(/[.-\s]/g, '').toUpperCase();
  
  if (rutLimpio.length < 2) return rutLimpio;
  
  const numero = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1);
  
  // Agregar puntos cada 3 dígitos desde la derecha
  const numeroFormateado = numero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return `${numeroFormateado}-${dv}`;
};

/**
 * Valida un número de celular chileno
 * @param celular - Número de celular
 * @returns boolean - true si el celular es válido
 */
export const validarCelularChileno = (celular: string): boolean => {
  if (!celular) return false;
  
  // Limpiar el número (remover espacios, guiones, paréntesis)
  const celularLimpio = celular.replace(/[\s\-()]/g, '');
  
  // Patrones válidos para celulares chilenos:
  // +56912345678 (con código país)
  // 56912345678 (con código país sin +)
  // 912345678 (formato nacional)
  // 9 12345678 (con espacio)
  
  const patronesValidos = [
    /^\+56[2-9]\d{8}$/, // +56 + código área + 8 dígitos
    /^56[2-9]\d{8}$/, // 56 + código área + 8 dígitos
    /^[2-9]\d{8}$/, // código área + 8 dígitos (9 dígitos total)
  ];
  
  return patronesValidos.some(patron => patron.test(celularLimpio));
};

/**
 * Formatea un número de celular chileno
 * @param celular - Número sin formato
 * @returns string - Celular formateado (+56 9 1234 5678)
 */
export const formatearCelularChileno = (celular: string): string => {
  if (!celular) return '';
  
  const celularLimpio = celular.replace(/[\s\-()]/g, '');
  
  // Si ya tiene código país, mantenerlo
  if (celularLimpio.startsWith('+56')) {
    const numero = celularLimpio.substring(3);
    if (numero.length === 9) {
      return `+56 ${numero.substring(0, 1)} ${numero.substring(1, 5)} ${numero.substring(5)}`;
    }
  } else if (celularLimpio.startsWith('56')) {
    const numero = celularLimpio.substring(2);
    if (numero.length === 9) {
      return `+56 ${numero.substring(0, 1)} ${numero.substring(1, 5)} ${numero.substring(5)}`;
    }
  } else if (celularLimpio.length === 9) {
    return `+56 ${celularLimpio.substring(0, 1)} ${celularLimpio.substring(1, 5)} ${celularLimpio.substring(5)}`;
  }
  
  return celular;
};

/**
 * Valida un email
 * @param email - Dirección de email
 * @returns boolean - true si el email es válido
 */
export const validarEmail = (email: string): boolean => {
  if (!email) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim().toLowerCase());
};
