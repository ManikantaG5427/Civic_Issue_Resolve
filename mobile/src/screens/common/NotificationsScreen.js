import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSocket } from '../../context/SocketContext';
import apiClient from '../../config/api';
import { colors } from '../../config/theme';
import Header from '../../components/Header';
import EmptyState from '../../components/EmptyState';
import { Bell, CheckCheck, Clock, ShieldCheck, ChevronRight } from 'lucide-react-native';

const NotificationsScreen = ({ navigation }) => {
  const { setUnreadCount } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get('/notifications?limit=25');
      const items = res.data.data?.notifications || res.data.data || [];
      setNotifications(items);
      const unread = items.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.warn('Failed to load notifications', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('Failed to mark all read', err);
    }
  };

  const handlePressNotification = async (item) => {
    if (!item.isRead) {
      try {
        await apiClient.patch(`/notifications/${item._id || item.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n._id === item._id || n.id === item.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (e) {
        // Continue navigation even if read fails
      }
    }

    if (item.issue || item.issueId) {
      navigation.navigate('IssueDetail', { issueId: item.issue?._id || item.issue || item.issueId });
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Notifications"
        subtitle="Live alerts on your civic reports and assignments"
        navigation={navigation}
        showNotifications={false}
      />

      {/* Top Bar with Mark All Read */}
      <View style={styles.toolbar}>
        <Text style={styles.toolbarCount}>
          {notifications.filter((n) => !n.isRead).length} Unread
        </Text>
        <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
          <CheckCheck size={14} color={colors.primaryLight} />
          <Text style={styles.markAllText}>Mark all as read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<Bell size={32} color={colors.primary} />}
            title="All Caught Up"
            description="You don't have any pending alerts or task updates at the moment."
          />
        ) : (
          <View style={styles.list}>
            {notifications.map((item) => (
              <TouchableOpacity
                key={item._id || item.id}
                style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
                onPress={() => handlePressNotification(item)}
                activeOpacity={0.7}
              >
                {!item.isRead && <View style={styles.unreadDot} />}

                <View style={styles.iconCircle}>
                  <ShieldCheck size={18} color={item.isRead ? colors.textMuted : colors.primaryLight} />
                </View>

                <View style={styles.content}>
                  <Text style={[styles.notifTitle, !item.isRead && styles.notifTitleUnread]}>
                    {item.title}
                  </Text>
                  <Text style={styles.notifMessage} numberOfLines={2}>
                    {item.message}
                  </Text>
                  <View style={styles.timeRow}>
                    <Clock size={11} color={colors.textDim} />
                    <Text style={styles.timeText}>
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>

                <ChevronRight size={16} color={colors.textDim} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toolbarCount: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  markAllText: {
    color: colors.primaryLight,
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  list: {
    gap: 10,
  },
  notifCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    position: 'relative',
  },
  notifCardUnread: {
    borderColor: 'rgba(14, 165, 233, 0.4)',
    backgroundColor: colors.surfaceCard,
  },
  unreadDot: {
    position: 'absolute',
    top: 14,
    left: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 3,
  },
  notifTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  notifTitleUnread: {
    color: colors.text,
    fontWeight: '700',
  },
  notifMessage: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  timeText: {
    color: colors.textDim,
    fontSize: 10,
  },
});

export default NotificationsScreen;
