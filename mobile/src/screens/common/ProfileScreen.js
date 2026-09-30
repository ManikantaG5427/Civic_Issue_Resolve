import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { colors } from '../../config/theme';
import Header from '../../components/Header';
import {
  User,
  Mail,
  Phone,
  Shield,
  HardHat,
  Server,
  LogOut,
  ChevronRight,
  Wifi,
  Info,
} from 'lucide-react-native';

const ProfileScreen = ({ navigation }) => {
  const { user, logout, apiUrl } = useAuth();
  const { isConnected } = useSocket();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of CivicResolve?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header
        title="My Account"
        subtitle="Manage your profile & workspace settings"
        navigation={navigation}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            {user?.role === 'field_worker' ? (
              <HardHat size={32} color={colors.warning} />
            ) : user?.role === 'admin' ? (
              <Shield size={32} color={colors.secondaryLight} />
            ) : (
              <User size={32} color={colors.primary} />
            )}
          </View>

          <Text style={styles.userName}>{user?.name || 'Civic User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>

          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>
              {user?.role?.toUpperCase().replace('_', ' ') || 'CITIZEN'}
            </Text>
          </View>
        </View>

        {/* Profile Details */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Profile Details</Text>

          <View style={styles.infoRow}>
            <Mail size={16} color={colors.textSecondary} />
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Phone size={16} color={colors.textSecondary} />
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{user?.phone || 'Not provided'}</Text>
          </View>

          {user?.department && (
            <View style={styles.infoRow}>
              <HardHat size={16} color={colors.textSecondary} />
              <Text style={styles.infoLabel}>Department</Text>
              <Text style={styles.infoValue}>
                {user?.department?.name || user?.department || 'Field Operations'}
              </Text>
            </View>
          )}
        </View>

        {/* System & Connection Info */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>System & Connectivity</Text>

          <View style={styles.infoRow}>
            <Wifi size={16} color={isConnected ? colors.accent : colors.danger} />
            <Text style={styles.infoLabel}>Real-Time Socket</Text>
            <Text style={[styles.infoValue, { color: isConnected ? colors.accent : colors.danger }]}>
              {isConnected ? 'Connected' : 'Offline'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Server size={16} color={colors.textSecondary} />
            <Text style={styles.infoLabel}>Backend Host</Text>
            <Text style={[styles.infoValue, { fontSize: 11 }]} numberOfLines={1}>
              {apiUrl}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Info size={16} color={colors.textSecondary} />
            <Text style={styles.infoLabel}>App Version</Text>
            <Text style={styles.infoValue}>v1.0.0 (Phase 3 Native)</Text>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut size={18} color={colors.dangerLight} />
          <Text style={styles.logoutText}>Sign Out of CivicResolve</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    alignItems: 'center',
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  userName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  userEmail: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  rolePill: {
    backgroundColor: colors.primaryGlow,
    borderWidth: 1,
    borderColor: colors.primaryDark,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 10,
  },
  rolePillText: {
    color: colors.primaryLight,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: 13,
    flex: 1,
  },
  infoValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  logoutText: {
    color: colors.dangerLight,
    fontWeight: '700',
    fontSize: 14,
  },
});

export default ProfileScreen;
