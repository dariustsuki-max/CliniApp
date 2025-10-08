
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
import { medicamentoService, usuarioService } from '../../services/dataService';
import { Medicamento } from '../../types';
import { colors, commonStyles, spacing, borderRadius } from '../../styles/commonStyles';

export default function InventarioScreen() {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const cargarMedicamentos = async () => {
    try {
      const medicamentosData = await medicamentoService.obtenerTodos();
      setMedicamentos(medicamentosData);
    } catch (error) {
      console.error('Error al cargar medicamentos:', error);
      Alert.alert('Error', 'No se pudieron cargar los medicamentos');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  const onRefresh = () => {
    setRefrescando(true);
    cargarMedicamentos();
  };

  useFocusEffect(
    useCallback(() => {
      cargarMedicamentos();
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

  const eliminarMedicamento = (medicamento: Medicamento) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Está seguro de que desea eliminar ${medicamento.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await medicamentoService.eliminar(medicamento.id);
              cargarMedicamentos();
              Alert.alert('Éxito', 'Medicamento eliminado correctamente');
            } catch (error) {
              console.error('Error al eliminar medicamento:', error);
              Alert.alert('Error', 'No se pudo eliminar el medicamento');
            }
          },
        },
      ]
    );
  };

  const editarMedicamento = (medicamento: Medicamento) => {
    router.push({
      pathname: '/editar-medicamento',
      params: { medicamentoId: medicamento.id },
    });
  };

  const obtenerEstadoVencimiento = (fechaVencimiento: string): 'vencido' | 'por-vencer' | 'vigente' => {
    const hoy = new Date();
    const fechaVenc = new Date(fechaVencimiento);
    const diasRestantes = Math.ceil((fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diasRestantes < 0) return 'vencido';
    if (diasRestantes <= 30) return 'por-vencer';
    return 'vigente';
  };

  const obtenerColorEstado = (estado: string): string => {
    switch (estado) {
      case 'vencido': return colors.error;
      case 'por-vencer': return colors.warning;
      default: return colors.success;
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

  const renderMedicamento = ({ item }: { item: Medicamento }) => {
    const estadoVencimiento = obtenerEstadoVencimiento(item.fechaVencimiento);
    const colorEstado = obtenerColorEstado(estadoVencimiento);
    const fechaVenc = new Date(item.fechaVencimiento);

    return (
      <View style={[styles.medicamentoCard, isDark ? commonStyles.cardDark : commonStyles.card]}>
        <View style={styles.medicamentoHeader}>
          <View style={styles.medicamentoInfo}>
            <Text style={[styles.medicamentoNombre, { color: theme.colors.text }]}>
              {item.nombre}
            </Text>
            
            {item.descripcion && (
              <Text style={[styles.medicamentoDescripcion, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                {item.descripcion}
              </Text>
            )}
            
            <View style={styles.cantidadContainer}>
              <Text style={[styles.medicamentoDetalle, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                📦 {item.cantidad} {item.unidad}
              </Text>
              {item.cantidad <= 10 && (
                <View style={[styles.stockBajo, { backgroundColor: colors.warning }]}>
                  <Text style={styles.stockBajoTexto}>Stock Bajo</Text>
                </View>
              )}
            </View>
            
            <Text style={[styles.medicamentoDetalle, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
              📅 Vence: {fechaVenc.toLocaleDateString('es-ES')}
            </Text>
            
            <View style={styles.vencimientoContainer}>
              <View style={[styles.estadoBadge, { backgroundColor: colorEstado }]}>
                <Text style={styles.estadoTexto}>
                  {estadoVencimiento === 'vencido' ? 'Vencido' : 
                   estadoVencimiento === 'por-vencer' ? 'Por Vencer' : 'Vigente'}
                </Text>
              </View>
            </View>

            {item.lote && (
              <Text style={[styles.medicamentoDetalle, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                🏷️ Lote: {item.lote}
              </Text>
            )}

            {item.proveedor && (
              <Text style={[styles.medicamentoDetalle, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                🏢 Proveedor: {item.proveedor}
              </Text>
            )}
          </View>
          
          <View style={styles.accionesContainer}>
            <TouchableOpacity
              style={[styles.botonAccion, { backgroundColor: colors.primary }]}
              onPress={() => editarMedicamento(item)}
            >
              <IconSymbol name="pencil" size={16} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.botonAccion, { backgroundColor: colors.error }]}
              onPress={() => eliminarMedicamento(item)}
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
      <IconSymbol name="pills" size={64} color={isDark ? colors.textSecondaryDark : colors.textSecondary} />
      <Text style={[styles.emptyStateText, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
        No hay medicamentos registrados
      </Text>
      <Text style={[styles.emptyStateSubtext, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
        Toca el botón + para agregar el primer medicamento
      </Text>
    </View>
  );

  if (cargando) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Cargando inventario...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Inventario ({medicamentos.length})
        </Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/agregar-medicamento')}
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
        data={medicamentos}
        renderItem={renderMedicamento}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          medicamentos.length === 0 && styles.emptyListContainer,
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
  medicamentoCard: {
    marginBottom: spacing.md,
  },
  medicamentoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  medicamentoInfo: {
    flex: 1,
  },
  medicamentoNombre: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  medicamentoDescripcion: {
    fontSize: 14,
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
  medicamentoDetalle: {
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  cantidadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  stockBajo: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: spacing.sm,
  },
  stockBajoTexto: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  vencimientoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  estadoBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  estadoTexto: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
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
