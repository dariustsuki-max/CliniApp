
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { IconSymbol } from '@/components/IconSymbol';
import { usuarioService, sillonService } from '../services/dataService';
import { colors, commonStyles, spacing, borderRadius } from '../styles/commonStyles';

export default function LoginScreen() {
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarContraseña, setMostrarContraseña] = useState(false);
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    // Inicializar datos por defecto
    const inicializar = async () => {
      try {
        await usuarioService.inicializar();
        await sillonService.inicializar();
        
        // Verificar si ya hay un usuario logueado
        const usuarioActual = await usuarioService.obtenerUsuarioActual();
        if (usuarioActual) {
          router.replace('/(tabs)/pacientes');
        }
      } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
      }
    };
    
    inicializar();
  }, []);

  const manejarLogin = async () => {
    if (!nombreUsuario.trim() || !contraseña.trim()) {
      Alert.alert('Error', 'Por favor ingrese usuario y contraseña');
      return;
    }

    setCargando(true);
    try {
      const usuario = await usuarioService.autenticar(nombreUsuario.trim(), contraseña);
      
      if (usuario) {
        console.log('Login exitoso:', usuario.nombreUsuario);
        router.replace('/(tabs)/pacientes');
      } else {
        Alert.alert('Error', 'Usuario o contraseña incorrectos');
      }
    } catch (error) {
      console.error('Error en login:', error);
      Alert.alert('Error', 'Ocurrió un error al iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  const mostrarCredencialesDemo = () => {
    Alert.alert(
      'Credenciales de Demo',
      'Usuario: admin\nContraseña: admin123',
      [
        {
          text: 'Usar Credenciales',
          onPress: () => {
            setNombreUsuario('admin');
            setContraseña('admin123');
          },
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
              <IconSymbol name="stethoscope" size={48} color="white" />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              Sistema Médico
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Gestión de Pacientes y Sillones
            </Text>
          </View>

          <View style={[styles.formContainer, commonStyles.card]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>
              Iniciar Sesión
            </Text>

            <View style={styles.inputContainer}>
              <IconSymbol name="person" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Nombre de usuario"
                placeholderTextColor={colors.placeholder}
                value={nombreUsuario}
                onChangeText={setNombreUsuario}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!cargando}
              />
            </View>

            <View style={styles.inputContainer}>
              <IconSymbol name="key" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Contraseña"
                placeholderTextColor={colors.placeholder}
                value={contraseña}
                onChangeText={setContraseña}
                secureTextEntry={!mostrarContraseña}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!cargando}
              />
              <TouchableOpacity
                onPress={() => setMostrarContraseña(!mostrarContraseña)}
                style={styles.eyeButton}
              >
                <IconSymbol
                  name={mostrarContraseña ? "eye.slash" : "eye"}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, { opacity: cargando ? 0.7 : 1 }]}
              onPress={manejarLogin}
              disabled={cargando}
            >
              <Text style={styles.loginButtonText}>
                {cargando ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoButton}
              onPress={mostrarCredencialesDemo}
            >
              <Text style={[styles.demoButtonText, { color: colors.primary }]}>
                Ver credenciales de demo
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  formContainer: {
    padding: spacing.lg,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: spacing.sm,
    paddingVertical: spacing.sm,
  },
  eyeButton: {
    padding: spacing.sm,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  demoButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  demoButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
