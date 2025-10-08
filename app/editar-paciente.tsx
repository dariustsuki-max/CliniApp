
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { IconSymbol } from '@/components/IconSymbol';
import { pacienteService, sillonService } from '../services/dataService';
import { Paciente, Sillon } from '../types';
import { colors, commonStyles, spacing, borderRadius } from '../styles/commonStyles';
import { validarRUT, formatearRUT, validarCelularChileno, formatearCelularChileno, validarEmail } from '../utils/validations';

export default function EditarPacienteScreen() {
  const { pacienteId } = useLocalSearchParams<{ pacienteId: string }>();
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [rut, setRut] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState(new Date());
  const [celular, setCelular] = useState('');
  const [correo, setCorreo] = useState('');
  const [anotaciones, setAnotaciones] = useState('');
  const [sillonAsignado, setSillonAsignado] = useState<string>('');
  const [sillones, setSillones] = useState<Sillon[]>([]);
  const [mostrarDatePicker, setMostrarDatePicker] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);
  
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    if (pacienteId) {
      cargarDatos();
    }
  }, [pacienteId]);

  const cargarDatos = async () => {
    try {
      const [pacienteData, sillonesData] = await Promise.all([
        pacienteService.obtenerPorId(pacienteId),
        sillonService.obtenerTodos(),
      ]);

      if (!pacienteData) {
        Alert.alert('Error', 'Paciente no encontrado', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        return;
      }

      setPaciente(pacienteData);
      setNombre(pacienteData.nombre);
      setApellidos(pacienteData.apellidos);
      setRut(pacienteData.rut || '');
      setFechaNacimiento(new Date(pacienteData.fechaNacimiento));
      setCelular(pacienteData.celular);
      setCorreo(pacienteData.correo);
      setAnotaciones(pacienteData.anotaciones || '');
      setSillonAsignado(pacienteData.sillonAsignado || '');
      setSillones(sillonesData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setCargando(false);
    }
  };

  const manejarCambioRut = (texto: string) => {
    const rutFormateado = formatearRUT(texto);
    setRut(rutFormateado);
  };

  const manejarCambioCelular = (texto: string) => {
    // Permitir solo números y algunos caracteres especiales
    const celularLimpio = texto.replace(/[^\d\s\-+()]/g, '');
    setCelular(celularLimpio);
  };

  const guardarCambios = async () => {
    if (!paciente) return;

    // Validaciones
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }
    if (!apellidos.trim()) {
      Alert.alert('Error', 'Los apellidos son obligatorios');
      return;
    }
    if (!rut.trim()) {
      Alert.alert('Error', 'El RUT es obligatorio');
      return;
    }
    if (!validarRUT(rut)) {
      Alert.alert('Error', 'El RUT ingresado no es válido');
      return;
    }
    if (!celular.trim()) {
      Alert.alert('Error', 'El celular es obligatorio');
      return;
    }
    if (!validarCelularChileno(celular)) {
      Alert.alert('Error', 'El número de celular no es válido para Chile');
      return;
    }
    if (!correo.trim()) {
      Alert.alert('Error', 'El correo es obligatorio');
      return;
    }
    if (!validarEmail(correo)) {
      Alert.alert('Error', 'El correo no tiene un formato válido');
      return;
    }

    setGuardando(true);
    try {
      await pacienteService.actualizar(paciente.id, {
        nombre: nombre.trim(),
        apellidos: apellidos.trim(),
        rut: rut.trim(),
        fechaNacimiento: fechaNacimiento.toISOString(),
        celular: celular.trim(),
        correo: correo.trim().toLowerCase(),
        anotaciones: anotaciones.trim(),
        sillonAsignado: sillonAsignado || undefined,
      });

      Alert.alert('Éxito', 'Paciente actualizado correctamente', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error al actualizar paciente:', error);
      Alert.alert('Error', 'No se pudo actualizar el paciente');
    } finally {
      setGuardando(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setMostrarDatePicker(false);
    if (selectedDate) {
      setFechaNacimiento(selectedDate);
    }
  };

  if (cargando) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Cargando datos del paciente...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!paciente) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Paciente no encontrado
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Editar Paciente
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.formContainer, isDark ? commonStyles.cardDark : commonStyles.card]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Nombre *
              </Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : null, { color: theme.colors.text }]}
                placeholder="Ingrese el nombre"
                placeholderTextColor={colors.placeholder}
                value={nombre}
                onChangeText={setNombre}
                autoCapitalize="words"
                editable={!guardando}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Apellidos *
              </Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : null, { color: theme.colors.text }]}
                placeholder="Ingrese los apellidos"
                placeholderTextColor={colors.placeholder}
                value={apellidos}
                onChangeText={setApellidos}
                autoCapitalize="words"
                editable={!guardando}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                RUT *
              </Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : null, { color: theme.colors.text }]}
                placeholder="12.345.678-9"
                placeholderTextColor={colors.placeholder}
                value={rut}
                onChangeText={manejarCambioRut}
                maxLength={12}
                editable={!guardando}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Fecha de Nacimiento *
              </Text>
              <TouchableOpacity
                style={[styles.dateButton, isDark ? styles.inputDark : styles.input]}
                onPress={() => setMostrarDatePicker(true)}
                disabled={guardando}
              >
                <Text style={[styles.dateText, { color: theme.colors.text }]}>
                  {fechaNacimiento.toLocaleDateString('es-ES')}
                </Text>
                <IconSymbol name="calendar" size={20} color={isDark ? colors.textSecondaryDark : colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Celular *
              </Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : null, { color: theme.colors.text }]}
                placeholder="+56 9 1234 5678"
                placeholderTextColor={colors.placeholder}
                value={celular}
                onChangeText={manejarCambioCelular}
                keyboardType="phone-pad"
                editable={!guardando}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Correo Electrónico *
              </Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : null, { color: theme.colors.text }]}
                placeholder="ejemplo@correo.com"
                placeholderTextColor={colors.placeholder}
                value={correo}
                onChangeText={setCorreo}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!guardando}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Anotaciones
              </Text>
              <TextInput
                style={[styles.textArea, isDark ? styles.inputDark : null, { color: theme.colors.text }]}
                placeholder="Notas sobre el paciente, historial médico, alergias, etc."
                placeholderTextColor={colors.placeholder}
                value={anotaciones}
                onChangeText={setAnotaciones}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!guardando}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Sillón Asignado (Opcional)
              </Text>
              <View style={[styles.pickerContainer, isDark ? styles.inputDark : styles.input]}>
                <Picker
                  selectedValue={sillonAsignado}
                  onValueChange={setSillonAsignado}
                  style={[styles.picker, { color: theme.colors.text }]}
                  enabled={!guardando}
                >
                  <Picker.Item label="Sin asignar" value="" />
                  {sillones.map((sillon) => (
                    <Picker.Item
                      key={sillon.id}
                      label={sillon.nombre}
                      value={sillon.id}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, { opacity: guardando ? 0.7 : 1 }]}
              onPress={guardarCambios}
              disabled={guardando}
            >
              <Text style={styles.saveButtonText}>
                {guardando ? 'Guardando...' : 'Guardar Cambios'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {mostrarDatePicker && (
          <DateTimePicker
            value={fechaNacimiento}
            mode="date"
            display="default"
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  formContainer: {
    padding: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputDark: {
    backgroundColor: colors.inputBackgroundDark,
    borderColor: colors.borderDark,
  },
  textArea: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 50,
  },
  dateText: {
    fontSize: 16,
  },
  pickerContainer: {
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
});
