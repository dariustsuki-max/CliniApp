
import React, { useState } from 'react';
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
import { router } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { IconSymbol } from '@/components/IconSymbol';
import { medicamentoService } from '../services/dataService';
import { colors, commonStyles, spacing, borderRadius } from '../styles/commonStyles';

const unidadesMedida = [
  'Unidades',
  'Tabletas',
  'Cápsulas',
  'ml',
  'mg',
  'g',
  'Frascos',
  'Ampollas',
  'Sobres',
  'Otros',
];

export default function AgregarMedicamentoScreen() {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [unidad, setUnidad] = useState('Unidades');
  const [fechaVencimiento, setFechaVencimiento] = useState(new Date());
  const [lote, setLote] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [mostrarDatePicker, setMostrarDatePicker] = useState(false);
  const [guardando, setGuardando] = useState(false);
  
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const guardarMedicamento = async () => {
    // Validaciones
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre del medicamento es obligatorio');
      return;
    }
    if (!cantidad.trim() || isNaN(Number(cantidad)) || Number(cantidad) <= 0) {
      Alert.alert('Error', 'La cantidad debe ser un número mayor a 0');
      return;
    }

    setGuardando(true);
    try {
      await medicamentoService.crear({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        cantidad: Number(cantidad),
        unidad: unidad,
        fechaVencimiento: fechaVencimiento.toISOString(),
        lote: lote.trim() || undefined,
        proveedor: proveedor.trim() || undefined,
      });

      Alert.alert('Éxito', 'Medicamento agregado correctamente', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error al guardar medicamento:', error);
      Alert.alert('Error', 'No se pudo guardar el medicamento');
    } finally {
      setGuardando(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setMostrarDatePicker(false);
    if (selectedDate) {
      setFechaVencimiento(selectedDate);
    }
  };

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
            Agregar Medicamento
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
                Nombre del Medicamento *
              </Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : null, { color: theme.colors.text }]}
                placeholder="Ej: Paracetamol 500mg"
                placeholderTextColor={colors.placeholder}
                value={nombre}
                onChangeText={setNombre}
                autoCapitalize="words"
                editable={!guardando}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Descripción
              </Text>
              <TextInput
                style={[styles.textArea, isDark ? styles.inputDark : null, { color: theme.colors.text }]}
                placeholder="Descripción del medicamento, indicaciones, etc."
                placeholderTextColor={colors.placeholder}
                value={descripcion}
                onChangeText={setDescripcion}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!guardando}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Cantidad *
              </Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : null, { color: theme.colors.text }]}
                placeholder="Ej: 100"
                placeholderTextColor={colors.placeholder}
                value={cantidad}
                onChangeText={setCantidad}
                keyboardType="numeric"
                editable={!guardando}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Unidad de Medida *
              </Text>
              <View style={[styles.pickerContainer, isDark ? styles.inputDark : styles.input]}>
                <Picker
                  selectedValue={unidad}
                  onValueChange={setUnidad}
                  style={[styles.picker, { color: theme.colors.text }]}
                  enabled={!guardando}
                >
                  {unidadesMedida.map((unidadItem) => (
                    <Picker.Item
                      key={unidadItem}
                      label={unidadItem}
                      value={unidadItem}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Fecha de Vencimiento *
              </Text>
              <TouchableOpacity
                style={[styles.dateButton, isDark ? styles.inputDark : styles.input]}
                onPress={() => setMostrarDatePicker(true)}
                disabled={guardando}
              >
                <Text style={[styles.dateText, { color: theme.colors.text }]}>
                  {fechaVencimiento.toLocaleDateString('es-ES')}
                </Text>
                <IconSymbol name="calendar" size={20} color={isDark ? colors.textSecondaryDark : colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Lote (Opcional)
              </Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : null, { color: theme.colors.text }]}
                placeholder="Ej: L2024001"
                placeholderTextColor={colors.placeholder}
                value={lote}
                onChangeText={setLote}
                autoCapitalize="characters"
                editable={!guardando}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Proveedor (Opcional)
              </Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : null, { color: theme.colors.text }]}
                placeholder="Ej: Laboratorio ABC"
                placeholderTextColor={colors.placeholder}
                value={proveedor}
                onChangeText={setProveedor}
                autoCapitalize="words"
                editable={!guardando}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, { opacity: guardando ? 0.7 : 1 }]}
              onPress={guardarMedicamento}
              disabled={guardando}
            >
              <Text style={styles.saveButtonText}>
                {guardando ? 'Guardando...' : 'Guardar Medicamento'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {mostrarDatePicker && (
          <DateTimePicker
            value={fechaVencimiento}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()}
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
    minHeight: 80,
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
});
