import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { colors } from '../config/theme';
import { Bell, Shield, User, HardHat } from 'lucide-react-native';

const Header = ({ title, subtitle, navigation, showNotifications = true }) => {
  const { user } = useAuth();
  const { isConnected, unreadCount } = useSocket();

  const getRoleIcon = () => {
    if (user?.role === 'field_worker') {
      return <HardHat size={14} color="#38bdf8" />;
    }
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      return <Shield size={14} color="#c084fc" />;
    }
    return <User size={14} color="#34d399" />;
  };

  const getRoleLabel = () => {
    if (user?.role === 'field_worker') return 'Worker';
    if (user?.role === 'super_admin') return 'Super Admin';
    if (user?.role === 'admin') return 'Admin';
    return 'Citizen';
  };

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={styles.titleRow}>
          <Text style={styles.brand}>Civic<Text style={styles.brandAccent}>Resolve</Text></Text>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? '#10b981' : '#ef4444' }]} />
        </View>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <View style={styles.right}>
        {user && (
          <View style={styles.roleBadge}>
            {getRoleIcon()}
            <Text style={styles.roleText}>{getRoleLabel()}</Text>
          </View>
        )}

        {showNotifications && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation?.navigate('Notifications')}
            activeOpacity={0.7}
          >
            <Bell size={20} color={colors.text} />
            {unreadCount > 0 && (
              <View style={styles.badgeCount}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brand: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: colors.primary,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginLeft: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceCard,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  roleText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.danger,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
});

export default Header;
