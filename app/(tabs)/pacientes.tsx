
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { IconSymbol } from '@/components/IconSymbol';
import { pacienteService, usuarioService, sillonService } from '../../services/dataService';
import { Paciente, Sillon } from '../../types';
import { colors, commonStyles, spacing, borderRadius } from '../../styles/commonStyles';

export default function PacientesScreen() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [sillones, setSillones] = useState<Sillon[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const cargarDatos = async () => {
    try {
      const [pacientesData, sillonesData] = await Promise.all([
        pacienteService.obtenerTodos(),
        sillonService.obtenerTodos(),
      ]);
      setPacientes(pacientesData);
      setSillones(sillonesData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  const onRefresh = () => {
    setRefrescando(true);
    cargarDatos();
  };

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [])
  );

  useEffect(() => {
    // Verificar autenticación
    const verificarAuth = async () => {
      const usuario = await usuarioService.obtenerUsuarioActual();
      if (!usuario) {
        router.replace('/login');
      }
    };
    verificarAuth();
  }, []);

  const obtenerNombreSillon = (sillonId?: string): string => {
    if (!sillonId) return 'Sin asignar';
    const sillon = sillones.find(s => s.id === sillonId);
    return sillon ? sillon.nombre : 'Sillón no encontrado';
  };

  const obtenerEstadoSillon = (sillonId?: string): 'disponible' | 'ocupado' | 'sin-asignar' => {
    if (!sillonId) return 'sin-asignar';
    const sillon = sillones.find(s => s.id === sillonId);
    if (!sillon) return 'sin-asignar';
    return sillon.disponible ? 'disponible' : 'ocupado';
  };

  const eliminarPaciente = (paciente: Paciente) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Está seguro de que desea eliminar a ${paciente.nombre} ${paciente.apellidos}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await pacienteService.eliminar(paciente.id);
              cargarDatos();
              Alert.alert('Éxito', 'Paciente eliminado correctamente');
            } catch (error) {
              console.error('Error al eliminar paciente:', error);
              Alert.alert('Error', 'No se pudo eliminar el paciente');
            }
          },
        },
      ]
    );
  };

  const editarPaciente = (paciente: Paciente) => {
    router.push({
      pathname: '/editar-paciente',
      params: { pacienteId: paciente.id },
    });
  };

  const cerrarSesion = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Está seguro de que desea cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          onPress: async () => {
            await usuarioService.cerrarSesion();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const renderPaciente = ({ item }: { item: Paciente }) => {
    const estadoSillon = obtenerEstadoSillon(item.sillonAsignado);
    const colorEstado = estadoSillon === 'ocupado' ? colors.occupied : 
                       estadoSillon === 'disponible' ? colors.available : 
                       colors.textSecondary;

    return (
      <View style={[styles.pacienteCard, isDark ? commonStyles.cardDark : commonStyles.card]}>
        <View style={styles.pacienteHeader}>
          <View style={styles.pacienteInfo}>
            <Text style={[styles.pacienteNombre, { color: theme.colors.text }]}>
              {item.nombre} {item.apellidos}
            </Text>
            
            {item.rut && (
              <Text style={[styles.pacienteDetalle, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                🆔 {item.rut}
              </Text>
            )}
            
            <Text style={[styles.pacienteDetalle, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
              📱 {item.celular}
            </Text>
            <Text style={[styles.pacienteDetalle, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
              📧 {item.correo}
            </Text>
            <Text style={[styles.pacienteDetalle, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
              🎂 {new Date(item.fechaNacimiento).toLocaleDateString('es-ES')}
            </Text>
            
            <View style={styles.sillonContainer}>
              <Text style={[styles.pacienteDetalle, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                🪑 {obtenerNombreSillon(item.sillonAsignado)}
              </Text>
              {item.sillonAsignado && (
                <View style={[styles.estadoBadge, { backgroundColor: colorEstado }]}>
                  <Text style={styles.estadoTexto}>
                    {estadoSillon === 'ocupado' ? 'Ocupado' : 'Disponible'}
                  </Text>
                </View>
              )}
            </View>

            {item.anotaciones && (
              <View style={styles.anotacionesContainer}>
                <Text style={[styles.anotacionesLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                  📝 Notas:
                </Text>
                <Text style={[styles.anotacionesTexto, { color: theme.colors.text }]} numberOfLines={2}>
                  {item.anotaciones}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.accionesContainer}>
            <TouchableOpacity
              style={[styles.botonAccion, { backgroundColor: colors.primary }]}
              onPress={() => editarPaciente(item)}
            >
              <IconSymbol name="pencil" size={16} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.botonAccion, { backgroundColor: colors.error }]}
              onPress={() => eliminarPaciente(item)}
            >
              <IconSymbol name="trash" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <IconSymbol name="person.3" size={64} color={isDark ? colors.textSecondaryDark : colors.textSecondary} />
      <Text style={[styles.emptyStateText, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
        No hay pacientes registrados
      </Text>
      <Text style={[styles.emptyStateSubtext, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
        Toca el botón + para agregar el primer paciente
      </Text>
    </View>
  );

  if (cargando) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Cargando pacientes...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Pacientes ({pacientes.length})
        </Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/agregar-paciente')}
          >
            <IconSymbol name="plus" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.error }]}
            onPress={cerrarSesion}
          >
            <IconSymbol name="power" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={pacientes}
        renderItem={renderPaciente}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          pacientes.length === 0 && styles.emptyListContainer,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  pacienteCard: {
    marginBottom: spacing.md,
  },
  pacienteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pacienteInfo: {
    flex: 1,
  },
  pacienteNombre: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  pacienteDetalle: {
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  sillonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  estadoBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: spacing.sm,
  },
  estadoTexto: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  anotacionesContainer: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.medicalBlue,
    borderRadius: borderRadius.sm,
  },
  anotacionesLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  anotacionesTexto: {
    fontSize: 13,
    lineHeight: 18,
  },
  accionesContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  botonAccion: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});
