
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
import { IconSymbol } from '@/components/IconSymbol';
import { sillonService } from '../services/dataService';
import { Sillon } from '../types';
import { colors, commonStyles, spacing, borderRadius } from '../styles/commonStyles';

export default function EditarSillonScreen() {
  const { sillonId } = useLocalSearchParams<{ sillonId: string }>();
  const [sillon, setSillon] = useState<Sillon | null>(null);
  const [numero, setNumero] = useState('');
  const [nombre, setNombre] = useState('');
  const [disponible, setDisponible] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);
  
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    if (sillonId) {
      cargarSillon();
    }
  }, [sillonId]);

  const cargarSillon = async () => {
    try {
      const sillonData = await sillonService.obtenerPorId(sillonId);

      if (!sillonData) {
        Alert.alert('Error', 'Sillón no encontrado', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        return;
      }

      setSillon(sillonData);
      setNumero(sillonData.numero.toString());
      setNombre(sillonData.nombre);
      setDisponible(sillonData.disponible);
    } catch (error) {
      console.error('Error al cargar sillón:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del sillón');
    } finally {
      setCargando(false);
    }
  };

  const guardarCambios = async () => {
    if (!sillon) return;

    // Validaciones
    if (!numero.trim()) {
      Alert.alert('Error', 'El número del sillón es obligatorio');
      return;
    }
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre del sillón es obligatorio');
      return;
    }

    const numeroInt = parseInt(numero.trim());
    if (isNaN(numeroInt) || numeroInt <= 0) {
      Alert.alert('Error', 'El número debe ser un valor positivo');
      return;
    }

    setGuardando(true);
    try {
      // Verificar si ya existe otro sillón con ese número
      if (numeroInt !== sillon.numero) {
        const sillonesExistentes = await sillonService.obtenerTodos();
        const sillonExistente = sillonesExistentes.find(s => s.numero === numeroInt && s.id !== sillon.id);
        
        if (sillonExistente) {
          Alert.alert('Error', `Ya existe otro sillón con el número ${numeroInt}`);
          setGuardando(false);
          return;
        }
      }

      await sillonService.actualizar(sillon.id, {
        numero: numeroInt,
        nombre: nombre.trim(),
        disponible,
      });

      Alert.alert('Éxito', 'Sillón actualizado correctamente', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error al actualizar sillón:', error);
      Alert.alert('Error', 'No se pudo actualizar el sillón');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Cargando datos del sillón...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!sillon) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Sillón no encontrado
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
            Editar Sillón
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
                Número del Sillón *
              </Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : null, { color: theme.colors.text }]}
                placeholder="Ej: 1, 2, 3..."
                placeholderTextColor={colors.placeholder}
                value={numero}
                onChangeText={setNumero}
                keyboardType="numeric"
                editable={!guardando}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Nombre del Sillón *
              </Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : null, { color: theme.colors.text }]}
                placeholder="Ej: Sillón 1, Sillón Principal..."
                placeholderTextColor={colors.placeholder}
                value={nombre}
                onChangeText={setNombre}
                autoCapitalize="words"
                editable={!guardando}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Estado
              </Text>
              <View style={styles.estadoContainer}>
                <TouchableOpacity
                  style={[
                    styles.estadoButton,
                    disponible && styles.estadoButtonActive,
                    disponible && { backgroundColor: colors.success },
                  ]}
                  onPress={() => setDisponible(true)}
                  disabled={guardando}
                >
                  <IconSymbol 
                    name="checkmark.circle" 
                    size={20} 
                    color={disponible ? 'white' : (isDark ? colors.textSecondaryDark : colors.textSecondary)} 
                  />
                  <Text style={[
                    styles.estadoButtonText,
                    disponible && styles.estadoButtonTextActive,
                    { color: disponible ? 'white' : theme.colors.text }
                  ]}>
                    Disponible
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.estadoButton,
                    !disponible && styles.estadoButtonActive,
                    !disponible && { backgroundColor: colors.error },
                  ]}
                  onPress={() => setDisponible(false)}
                  disabled={guardando}
                >
                  <IconSymbol 
                    name="pause.circle" 
                    size={20} 
                    color={!disponible ? 'white' : (isDark ? colors.textSecondaryDark : colors.textSecondary)} 
                  />
                  <Text style={[
                    styles.estadoButtonText,
                    !disponible && styles.estadoButtonTextActive,
                    { color: !disponible ? 'white' : theme.colors.text }
                  ]}>
                    Ocupado
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.infoContainer}>
              <Text style={[styles.infoLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                Información del Sillón
              </Text>
              <Text style={[styles.infoText, { color: theme.colors.text }]}>
                📅 Creado: {new Date(sillon.fechaCreacion).toLocaleDateString('es-ES')}
              </Text>
              {sillon.fechaActualizacion !== sillon.fechaCreacion && (
                <Text style={[styles.infoText, { color: theme.colors.text }]}>
                  🔄 Última actualización: {new Date(sillon.fechaActualizacion).toLocaleDateString('es-ES')}
                </Text>
              )}
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
  },
  inputDark: {
    backgroundColor: colors.inputBackgroundDark,
  },
  estadoContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  estadoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.inputBackground,
    gap: spacing.sm,
  },
  estadoButtonActive: {
    // backgroundColor set dynamically
  },
  estadoButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  estadoButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  infoContainer: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.sm,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: 14,
    marginBottom: spacing.xs,
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
