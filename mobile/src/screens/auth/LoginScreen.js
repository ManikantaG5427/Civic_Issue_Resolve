import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../config/theme';
import { Shield, Mail, Lock, Server, ArrowRight, CheckCircle } from 'lucide-react-native';

const LoginScreen = ({ navigation }) => {
  const { login, apiUrl, updateApiUrl } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [customUrl, setCustomUrl] = useState(apiUrl);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation Error', 'Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      await login(email.trim(), password);
    } catch (err) {
      Alert.alert('Authentication Failed', err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  const handleSaveApiUrl = async () => {
    if (!customUrl) return;
    try {
      await updateApiUrl(customUrl);
      setShowConfig(false);
      Alert.alert('Server Configured', `API URL set to: ${customUrl}`);
    } catch (e) {
      Alert.alert('Error', 'Failed to update API URL.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Logo & Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Shield size={36} color={colors.primary} />
          </View>
          <Text style={styles.title}>Civic<Text style={styles.titleAccent}>Resolve</Text></Text>
          <Text style={styles.subtitle}>Mobile Citizen & Field Worker Platform</Text>
        </View>

        {/* Demo Fast Fill Card */}
        <View style={styles.demoCard}>
          <Text style={styles.demoTitle}>⚡ Quick Demo Sign-In</Text>
          <View style={styles.demoButtons}>
            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => handleDemoFill('citizen@civicresolve.org', 'Password123!')}
            >
              <Text style={styles.demoBtnText}>Citizen</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoBtn, styles.demoBtnWorker]}
              onPress={() => handleDemoFill('worker@civicresolve.org', 'Password123!')}
            >
              <Text style={[styles.demoBtnText, styles.demoBtnTextWorker]}>Field Worker</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoBtn, styles.demoBtnAdmin]}
              onPress={() => handleDemoFill('admin@civicresolve.org', 'Password123!')}
            >
              <Text style={[styles.demoBtnText, styles.demoBtnTextAdmin]}>Admin</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Login Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Mail size={18} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="name@civicresolve.org"
                placeholderTextColor={colors.textDim}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={18} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••••••"
                placeholderTextColor={colors.textDim}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Sign In to Workspace</Text>
                <ArrowRight size={18} color={colors.white} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Register Link */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Register as Citizen</Text>
          </TouchableOpacity>
        </View>

        {/* Server Endpoint Config Toggle */}
        <View style={styles.serverConfigContainer}>
          <TouchableOpacity
            style={styles.serverConfigToggle}
            onPress={() => setShowConfig(!showConfig)}
          >
            <Server size={14} color={colors.textMuted} />
            <Text style={styles.serverConfigText}>
              Backend: {apiUrl}
            </Text>
          </TouchableOpacity>

          {showConfig && (
            <View style={styles.serverConfigBox}>
              <Text style={styles.serverConfigLabel}>Set Custom API Host:</Text>
              <TextInput
                style={styles.serverInput}
                value={customUrl}
                onChangeText={setCustomUrl}
                placeholder="http://192.168.x.x:5000/api"
                placeholderTextColor={colors.textDim}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity style={styles.serverSaveBtn} onPress={handleSaveApiUrl}>
                <CheckCircle size={14} color={colors.white} />
                <Text style={styles.serverSaveBtnText}>Save Host</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryGlow,
    borderWidth: 1,
    borderColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  titleAccent: {
    color: colors.primary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  demoCard: {
    backgroundColor: colors.surfaceCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 20,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    textAlign: 'center',
  },
  demoButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  demoBtn: {
    flex: 1,
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.3)',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  demoBtnText: {
    color: colors.primaryLight,
    fontWeight: '700',
    fontSize: 12,
  },
  demoBtnWorker: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  demoBtnTextWorker: {
    color: colors.warningLight,
  },
  demoBtnAdmin: {
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  demoBtnTextAdmin: {
    color: '#c084fc',
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  registerLink: {
    color: colors.primaryLight,
    fontWeight: '700',
    fontSize: 14,
  },
  serverConfigContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  serverConfigToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  serverConfigText: {
    fontSize: 11,
    color: colors.textDim,
  },
  serverConfigBox: {
    width: '100%',
    backgroundColor: colors.surfaceCard,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
    gap: 8,
  },
  serverConfigLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  serverInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: colors.text,
    fontSize: 12,
  },
  serverSaveBtn: {
    backgroundColor: colors.primaryDark,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  serverSaveBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
});

export default LoginScreen;
