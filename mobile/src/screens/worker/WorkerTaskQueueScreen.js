import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../config/api';
import { colors } from '../../config/theme';
import Header from '../../components/Header';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import EmptyState from '../../components/EmptyState';
import {
  HardHat,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react-native';

const WorkerTaskQueueScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); // active | assigned | in_progress | resolved

  const fetchTasks = async () => {
    try {
      const res = await apiClient.get('/worker/tasks?limit=25');
      const items = res.data.data?.tasks || res.data.data || [];
      setTasks(items);
    } catch (err) {
      console.warn('Error fetching worker tasks', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchTasks();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTasks();
  }, []);

  const filteredTasks = tasks.filter((task) => {
    if (activeTab === 'assigned') return task.status === 'assigned';
    if (activeTab === 'in_progress') return task.status === 'in_progress';
    if (activeTab === 'resolved')
      return (
        task.status === 'resolved_verification_pending' ||
        task.status === 'resolved_confirmed'
      );
    // 'active' includes assigned and in_progress
    return task.status === 'assigned' || task.status === 'in_progress';
  });

  const getSlaTimeRemaining = (deadline) => {
    if (!deadline) return null;
    const diff = new Date(deadline) - new Date();
    if (diff <= 0) return { text: 'OVERDUE', overdue: true };
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { text: `${hours}h ${mins}m remaining`, overdue: false };
  };

  return (
    <View style={styles.container}>
      <Header
        title={`Field Crew: ${user?.name?.split(' ')[0] || 'Worker'}`}
        subtitle="Department field task dispatch & resolution"
        navigation={navigation}
      />

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {[
            { id: 'active', label: 'Active Queue' },
            { id: 'assigned', label: 'New Assigned' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'resolved', label: 'Completed' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabBtn, activeTab === tab.id && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[styles.tabBtnText, activeTab === tab.id && styles.tabBtnTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.warning}
            colors={[colors.warning]}
          />
        }
      >
        {loading ? (
          <ActivityIndicator color={colors.warning} style={{ marginTop: 40 }} />
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            icon={<HardHat size={32} color={colors.warning} />}
            title="No Tasks Found"
            description={`No civic tasks currently in the "${activeTab}" filter.`}
            actionText="Refresh Dispatch Queue"
            onAction={fetchTasks}
          />
        ) : (
          <View style={styles.taskList}>
            {filteredTasks.map((item) => {
              const sla = getSlaTimeRemaining(item.assignment?.slaDeadline || item.slaDeadline);

              return (
                <TouchableOpacity
                  key={item._id || item.id}
                  style={[
                    styles.card,
                    item.isEscalated && styles.cardEscalated,
                    item.status === 'in_progress' && styles.cardInProgress,
                  ]}
                  onPress={() =>
                    navigation.navigate('WorkerTaskAction', {
                      taskId: item._id || item.id,
                      taskData: item,
                    })
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.trackingNumber}>
                      {item.trackingNumber || 'TASK-DISPATCH'}
                    </Text>
                    <StatusBadge status={item.status} size="small" />
                  </View>

                  <Text style={styles.taskTitle} numberOfLines={2}>
                    {item.title}
                  </Text>

                  {/* Location */}
                  <View style={styles.metaItem}>
                    <MapPin size={13} color={colors.textSecondary} />
                    <Text style={styles.metaText} numberOfLines={1}>
                      {item.location?.address || item.serviceArea?.name || 'Municipal Area'}
                    </Text>
                  </View>

                  {/* SLA Countdown Badge */}
                  {sla && (
                    <View style={[styles.slaBadge, sla.overdue && styles.slaOverdue]}>
                      <Clock size={12} color={sla.overdue ? colors.dangerLight : colors.warningLight} />
                      <Text style={[styles.slaText, sla.overdue && styles.slaOverdueText]}>
                        SLA: {sla.text}
                      </Text>
                    </View>
                  )}

                  {/* Card Bottom Toolbar */}
                  <View style={styles.cardFooter}>
                    <PriorityBadge priority={item.priority} size="small" />

                    <View style={styles.actionPrompt}>
                      {item.status === 'assigned' && (
                        <View style={styles.actionPill}>
                          <Play size={12} color={colors.primaryLight} />
                          <Text style={styles.actionPillText}>Start Work</Text>
                        </View>
                      )}

                      {item.status === 'in_progress' && (
                        <View style={[styles.actionPill, styles.actionPillResolve]}>
                          <CheckCircle size={12} color={colors.accentLight} />
                          <Text style={[styles.actionPillText, { color: colors.accentLight }]}>
                            Complete Proof
                          </Text>
                        </View>
                      )}

                      <ArrowRight size={14} color={colors.textMuted} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
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
  tabsContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8,
  },
  tabsRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: colors.warning,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabBtnTextActive: {
    color: colors.warningLight,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  taskList: {
    gap: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
  },
  cardEscalated: {
    borderColor: 'rgba(239, 68, 68, 0.6)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  cardInProgress: {
    borderColor: 'rgba(14, 165, 233, 0.5)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackingNumber: {
    color: colors.warningLight,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  taskTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 12,
    flex: 1,
  },
  slaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warningGlow,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  slaOverdue: {
    backgroundColor: colors.dangerGlow,
    borderColor: colors.danger,
  },
  slaText: {
    color: colors.warningLight,
    fontSize: 11,
    fontWeight: '700',
  },
  slaOverdueText: {
    color: colors.dangerLight,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryGlow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actionPillResolve: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  actionPillText: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: '700',
  },
});

export default WorkerTaskQueueScreen;
