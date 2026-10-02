import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import apiClient from '../../config/api';
import { colors } from '../../config/theme';
import Header from '../../components/Header';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import { MapPin, Filter, Layers, Navigation } from 'lucide-react-native';

const CATEGORY_FILTERS = [
  'All Categories',
  'Roads & Potholes',
  'Garbage & Sanitation',
  'Water Leakage & Supply',
  'Streetlights & Electrical',
];

const PublicMapScreen = ({ navigation }) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | resolved
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  const fetchPublicIssues = async () => {
    try {
      setLoading(true);
      const query = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const res = await apiClient.get(`/issues/public-map${query}`);
      setIssues(res.data.data?.issues || res.data.data || []);
    } catch (err) {
      console.warn('Failed to fetch public map issues', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicIssues();
  }, [statusFilter]);

  const filteredIssues = issues.filter((issue) => {
    if (selectedCategory === 'All Categories') return true;
    const catName = issue.category?.name || issue.category || '';
    return catName.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  return (
    <View style={styles.container}>
      <Header
        title="Civic Issue Explorer"
        subtitle="Verified municipal reports across your city"
        navigation={navigation}
      />

      {/* Preset Status Filters */}
      <View style={styles.statusPresetRow}>
        {[
          { id: 'all', label: 'All Reports' },
          { id: 'active', label: 'Active Reports' },
          { id: 'resolved', label: 'Resolved Works' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.presetTab, statusFilter === tab.id && styles.presetTabActive]}
            onPress={() => setStatusFilter(tab.id)}
          >
            <Text
              style={[
                styles.presetTabText,
                statusFilter === tab.id && styles.presetTabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category Chips */}
      <View style={styles.categoryBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {CATEGORY_FILTERS.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, selectedCategory === cat && styles.catChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.catChipText,
                  selectedCategory === cat && styles.catChipTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Map Header Graphic / Summary */}
        <View style={styles.mapGraphicCard}>
          <View style={styles.mapIconCircle}>
            <Navigation size={24} color={colors.primaryLight} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.mapCardTitle}>Public Civic Map</Text>
            <Text style={styles.mapCardSub}>
              Showing {filteredIssues.length} verified community reports
            </Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : filteredIssues.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No civic reports found in this view filter.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredIssues.map((item) => (
              <TouchableOpacity
                key={item._id || item.id}
                style={styles.card}
                onPress={() =>
                  navigation.navigate('IssueDetail', { issueId: item._id || item.id })
                }
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.trackingNumber}>
                    {item.trackingNumber || 'CIVIC-REPORT'}
                  </Text>
                  <StatusBadge status={item.status} size="small" />
                </View>

                <Text style={styles.cardTitle}>{item.title}</Text>

                <View style={styles.locRow}>
                  <MapPin size={13} color={colors.textSecondary} />
                  <Text style={styles.locText} numberOfLines={1}>
                    {item.location?.address || item.serviceArea?.name || 'Municipal Area'}
                  </Text>
                </View>

                <View style={styles.cardFooter}>
                  <PriorityBadge priority={item.priority} size="small" />
                  <Text style={styles.catText}>
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
  statusPresetRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  presetTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  presetTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  presetTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  presetTabTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  categoryBar: {
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  catChipActive: {
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    borderColor: colors.primary,
  },
  catChipText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  catChipTextActive: {
    color: colors.primaryLight,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  mapGraphicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
  },
  mapIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapCardTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  mapCardSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  list: {
    gap: 10,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackingNumber: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  cardTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locText: {
    color: colors.textMuted,
    fontSize: 12,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  catText: {
    color: colors.textMuted,
    fontSize: 11,
    backgroundColor: colors.surfaceCard,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
});

export default PublicMapScreen;
