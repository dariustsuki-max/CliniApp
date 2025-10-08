
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
import { sillonService, usuarioService, pacienteService } from '../../services/dataService';
import { Sillon, Paciente } from '../../types';
import { colors, commonStyles, spacing, borderRadius } from '../../styles/commonStyles';

export default function SillonesScreen() {
  const [sillones, setSillones] = useState<Sillon[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const cargarSillones = async () => {
    try {
      const [sillonesData, pacientesData] = await Promise.all([
        sillonService.obtenerTodos(),
        pacienteService.obtenerTodos(),
      ]);
      setSillones(sillonesData);
      setPacientes(pacientesData);
    } catch (error) {
      console.error('Error al cargar sillones:', error);
      Alert.alert('Error', 'No se pudieron cargar los sillones');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  const onRefresh = () => {
    setRefrescando(true);
    cargarSillones();
  };

  useFocusEffect(
    useCallback(() => {
      cargarSillones();
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

  const obtenerPacienteAsignado = (sillonId: string): Paciente | null => {
    return pacientes.find(p => p.sillonAsignado === sillonId) || null;
  };

  const eliminarSillon = (sillon: Sillon) => {
    // Verificar si hay un paciente asignado
    const pacienteAsignado = obtenerPacienteAsignado(sillon.id);
    if (pacienteAsignado) {
      Alert.alert(
        'No se puede eliminar',
        `El sillón está ocupado por ${pacienteAsignado.nombre} ${pacienteAsignado.apellidos}. Primero debe reasignar o eliminar al paciente.`
      );
      return;
    }

    Alert.alert(
      'Confirmar eliminación',
      `¿Está seguro de que desea eliminar ${sillon.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await sillonService.eliminar(sillon.id);
              cargarSillones();
              Alert.alert('Éxito', 'Sillón eliminado correctamente');
            } catch (error) {
              console.error('Error al eliminar sillón:', error);
              Alert.alert('Error', 'No se pudo eliminar el sillón');
            }
          },
        },
      ]
    );
  };

  const editarSillon = (sillon: Sillon) => {
    router.push({
      pathname: '/editar-sillon',
      params: { sillonId: sillon.id },
    });
  };

  const toggleDisponibilidad = async (sillon: Sillon) => {
    const pacienteAsignado = obtenerPacienteAsignado(sillon.id);
    
    if (!sillon.disponible && pacienteAsignado) {
      Alert.alert(
        'Sillón Ocupado',
        `Este sillón está ocupado por ${pacienteAsignado.nombre} ${pacienteAsignado.apellidos}. Para liberarlo, debe reasignar o eliminar al paciente.`
      );
      return;
    }

    try {
      await sillonService.actualizar(sillon.id, {
        disponible: !sillon.disponible,
      });
      cargarSillones();
    } catch (error) {
      console.error('Error al cambiar disponibilidad:', error);
      Alert.alert('Error', 'No se pudo cambiar la disponibilidad del sillón');
    }
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

  const renderSillon = ({ item }: { item: Sillon }) => {
    const pacienteAsignado = obtenerPacienteAsignado(item.id);
    const estaOcupado = !!pacienteAsignado;
    const colorEstado = estaOcupado ? colors.occupied : colors.available;
    const iconoEstado = estaOcupado ? 'person.fill' : 'checkmark.circle.fill';

    return (
      <View style={[styles.sillonCard, isDark ? commonStyles.cardDark : commonStyles.card]}>
        <View style={styles.sillonHeader}>
          <View style={styles.sillonInfo}>
            <View style={styles.nombreContainer}>
              <Text style={[styles.sillonNombre, { color: theme.colors.text }]}>
                {item.nombre}
              </Text>
              <View style={[styles.estadoBadge, { backgroundColor: colorEstado }]}>
                <IconSymbol name={iconoEstado} size={12} color="white" />
                <Text style={styles.estadoTexto}>
                  {estaOcupado ? 'Ocupado' : 'Disponible'}
                </Text>
              </View>
            </View>
            
            <Text style={[styles.sillonDetalle, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
              🪑 Sillón #{item.numero}
            </Text>

            {pacienteAsignado && (
              <View style={styles.pacienteAsignadoContainer}>
                <Text style={[styles.pacienteAsignadoLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                  👤 Paciente asignado:
                </Text>
                <Text style={[styles.pacienteAsignadoNombre, { color: theme.colors.text }]}>
                  {pacienteAsignado.nombre} {pacienteAsignado.apellidos}
                </Text>
                <Text style={[styles.pacienteAsignadoDetalle, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                  📱 {pacienteAsignado.celular}
                </Text>
              </View>
            )}

            <Text style={[styles.fechaCreacion, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
              Creado: {new Date(item.fechaCreacion).toLocaleDateString('es-ES')}
            </Text>
          </View>
          
          <View style={styles.accionesContainer}>
            <TouchableOpacity
              style={[styles.botonAccion, { backgroundColor: colorEstado }]}
              onPress={() => toggleDisponibilidad(item)}
            >
              <IconSymbol 
                name={estaOcupado ? 'xmark' : 'checkmark'} 
                size={16} 
                color="white" 
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.botonAccion, { backgroundColor: colors.primary }]}
              onPress={() => editarSillon(item)}
            >
              <IconSymbol name="pencil" size={16} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.botonAccion, { backgroundColor: colors.error }]}
              onPress={() => eliminarSillon(item)}
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
      <IconSymbol name="chair" size={64} color={isDark ? colors.textSecondaryDark : colors.textSecondary} />
      <Text style={[styles.emptyStateText, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
        No hay sillones registrados
      </Text>
      <Text style={[styles.emptyStateSubtext, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
        Toca el botón + para agregar el primer sillón
      </Text>
    </View>
  );

  if (cargando) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Cargando sillones...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const sillonesDisponibles = sillones.filter(s => s.disponible).length;
  const sillonesOcupados = sillones.length - sillonesDisponibles;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Sillones ({sillones.length})
          </Text>
          <Text style={[styles.headerSubtitle, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
            {sillonesDisponibles} disponibles • {sillonesOcupados} ocupados
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/agregar-sillon')}
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
        data={sillones}
        renderItem={renderSillon}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          sillones.length === 0 && styles.emptyListContainer,
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
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
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
  sillonCard: {
    marginBottom: spacing.md,
  },
  sillonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sillonInfo: {
    flex: 1,
  },
  nombreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sillonNombre: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  estadoTexto: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  sillonDetalle: {
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  pacienteAsignadoContainer: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.medicalBlue,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  pacienteAsignadoLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  pacienteAsignadoNombre: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  pacienteAsignadoDetalle: {
    fontSize: 12,
  },
  fechaCreacion: {
    fontSize: 12,
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
