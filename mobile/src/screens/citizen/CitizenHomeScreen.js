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
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../config/api';
import { colors } from '../../config/theme';
import Header from '../../components/Header';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import EmptyState from '../../components/EmptyState';
import { PlusCircle, MapPin, Clock, ArrowRight, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react-native';

const CitizenHomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState({ total: 0, active: 0, resolved: 0 });

  const fetchReports = async () => {
    try {
      const response = await apiClient.get('/issues/my-reports?limit=10');
      const items = response.data.data?.issues || response.data.data || [];
      setReports(items);

      // Compute quick metrics
      const total = items.length;
      const resolved = items.filter(
        (i) => i.status === 'resolved_confirmed' || i.status === 'resolved_verification_pending'
      ).length;
      const active = total - resolved;
      setMetrics({ total, active, resolved });
    } catch (err) {
      console.warn('Error fetching reports', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchReports();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReports();
  }, []);

  return (
    <View style={styles.container}>
      <Header
        title={`Hello, ${user?.name?.split(' ')[0] || 'Citizen'}`}
        subtitle="Manage and track your civic issue reports"
        navigation={navigation}
      />

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
        {/* Quick Report Action Card */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('ReportIssue')}
          activeOpacity={0.85}
        >
          <View style={styles.actionCardLeft}>
            <View style={styles.actionIconBox}>
              <PlusCircle size={28} color={colors.white} />
            </View>
            <View style={styles.actionTextBox}>
              <Text style={styles.actionTitle}>Report a Civic Issue</Text>
              <Text style={styles.actionSubtitle}>
                Snap a photo, drop GPS pin & submit to city department
              </Text>
            </View>
          </View>
          <ArrowRight size={20} color={colors.primaryLight} />
        </TouchableOpacity>

        {/* Stats Strip */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <ShieldAlert size={18} color={colors.primary} />
            <Text style={styles.statNumber}>{metrics.total}</Text>
            <Text style={styles.statLabel}>Filed Issues</Text>
          </View>

          <View style={styles.statCard}>
            <AlertTriangle size={18} color={colors.warning} />
            <Text style={[styles.statNumber, { color: colors.warning }]}>{metrics.active}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>

          <View style={styles.statCard}>
            <CheckCircle2 size={18} color={colors.accent} />
            <Text style={[styles.statNumber, { color: colors.accent }]}>{metrics.resolved}</Text>
            <Text style={styles.statLabel}>Resolved</Text>
          </View>
        </View>

        {/* Recent Reports Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Recent Reports</Text>
          <TouchableOpacity onPress={() => navigation.navigate('PublicMap')}>
            <Text style={styles.sectionLink}>View City Map</Text>
          </TouchableOpacity>
        </View>

        {/* Reports List */}
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
        ) : reports.length === 0 ? (
          <EmptyState
            icon={<ShieldAlert size={32} color={colors.primary} />}
            title="No Reports Filed Yet"
            description="Notice a pothole, broken streetlight, or water leakage? File a report in seconds."
            actionText="Report Your First Issue"
            onAction={() => navigation.navigate('ReportIssue')}
          />
        ) : (
          <View style={styles.list}>
            {reports.map((item) => (
              <TouchableOpacity
                key={item._id || item.id}
                style={styles.card}
                onPress={() => navigation.navigate('IssueDetail', { issueId: item._id || item.id })}
                activeOpacity={0.7}
              >
                <View style={styles.cardTopRow}>
                  <Text style={styles.trackingNumber}>{item.trackingNumber || 'CIVIC-REPORT'}</Text>
                  <StatusBadge status={item.status} size="small" />
                </View>

                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>

                <View style={styles.cardMeta}>
                  <View style={styles.metaItem}>
                    <MapPin size={13} color={colors.textSecondary} />
                    <Text style={styles.metaText} numberOfLines={1}>
                      {item.location?.address || 'Kukatpally Pilot Area'}
                    </Text>
                  </View>

                  <View style={styles.metaItem}>
                    <Clock size={13} color={colors.textSecondary} />
                    <Text style={styles.metaText}>
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <PriorityBadge priority={item.priority} size="small" />
                  <Text style={styles.categoryBadge}>
                    {item.category?.name || item.category || 'General'}
                  </Text>
                </View>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  actionCard: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1.5,
    borderColor: 'rgba(14, 165, 233, 0.4)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  actionCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 14,
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextBox: {
    flex: 1,
  },
  actionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  actionSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  sectionLink: {
    fontSize: 13,
    color: colors.primaryLight,
    fontWeight: '600',
  },
  list: {
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
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackingNumber: {
    color: colors.primaryLight,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  cardTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  categoryBadge: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: colors.surfaceCard,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
});

export default CitizenHomeScreen;
