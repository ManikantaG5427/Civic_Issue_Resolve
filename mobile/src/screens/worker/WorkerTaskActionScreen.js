import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../../config/api';
import { colors } from '../../config/theme';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import {
  Play,
  CheckCircle,
  FileText,
  Camera,
  Image as ImageIcon,
  MapPin,
  Clock,
  ChevronLeft,
  Lock,
  Plus,
  Send,
  X,
  HardHat,
} from 'lucide-react-native';

const WorkerTaskActionScreen = ({ route, navigation }) => {
  const { taskId } = route.params || {};
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Progress update form
  const [progressNote, setProgressNote] = useState('');
  const [materialsUsed, setMaterialsUsed] = useState('');
  const [showProgressForm, setShowProgressForm] = useState(false);

  // Resolution form
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [resolutionPhotos, setResolutionPhotos] = useState([]);
  const [materialsFinal, setMaterialsFinal] = useState('');
  const [showResolveForm, setShowResolveForm] = useState(false);

  // Internal note state
  const [internalNote, setInternalNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/issues/${taskId}`);
      setTask(res.data.data);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not load task details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) {
      fetchTaskDetails();
    }
  }, [taskId]);

  // Start Work Action
  const handleStartWork = async () => {
    try {
      setActionLoading(true);
      await apiClient.post(`/worker/issues/${taskId}/start-work`);
      Alert.alert('Work Started', 'Status changed to In Progress. Time tracking active.');
      fetchTaskDetails();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to start work.');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Progress Note
  const handleSubmitProgress = async () => {
    if (!progressNote.trim()) {
      Alert.alert('Note Required', 'Please enter a brief progress description.');
      return;
    }

    try {
      setActionLoading(true);
      const materialsArray = materialsUsed
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean);

      await apiClient.post(`/worker/issues/${taskId}/progress-update`, {
        notes: progressNote.trim(),
        materialsUsed: materialsArray,
      });

      Alert.alert('Progress Logged', 'Work update recorded on the dispatch timeline.');
      setProgressNote('');
      setMaterialsUsed('');
      setShowProgressForm(false);
      fetchTaskDetails();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to record progress update.');
    } finally {
      setActionLoading(false);
    }
  };

  // Pick Proof Photo
  const handleAddProofPhoto = async (fromCamera = false) => {
    let result;
    if (fromCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera access is required.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({ quality: 0.8, aspect: [4, 3] });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery access is required.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, aspect: [4, 3] });
    }

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setResolutionPhotos((prev) => [...prev, result.assets[0].uri]);
    }
  };

  // Submit Resolution Proof
  const handleResolveTask = async () => {
    if (!resolutionSummary.trim() || resolutionSummary.trim().length < 10) {
      Alert.alert('Validation Error', 'Resolution summary must be at least 10 characters.');
      return;
    }

    if (resolutionPhotos.length === 0) {
      Alert.alert('Photo Proof Required', 'You must capture or attach at least 1 photo proving completion.');
      return;
    }

    try {
      setActionLoading(true);
      const materialsArray = materialsFinal
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean);

      await apiClient.post(`/worker/issues/${taskId}/resolve`, {
        resolutionSummary: resolutionSummary.trim(),
        photos: resolutionPhotos,
        materialsUsed: materialsArray,
      });

      Alert.alert(
        'Resolution Submitted!',
        'Task marked resolved. Citizen has been notified to verify the repair.',
        [{ text: 'Back to Queue', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to submit resolution.');
    } finally {
      setActionLoading(false);
    }
  };

  // Post Internal Note
  const handleAddInternalNote = async () => {
    if (!internalNote.trim()) return;
    try {
      setSubmittingNote(true);
      await apiClient.post(`/issues/${taskId}/comments`, {
        content: internalNote.trim(),
        isInternal: true,
      });
      Alert.alert('Internal Note Logged', 'Saved to private staff log.');
      setInternalNote('');
      fetchTaskDetails();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to post note.');
    } finally {
      setSubmittingNote(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.warning} />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Task not found.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Top Navbar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>{task.trackingNumber || 'TASK'}</Text>
        <StatusBadge status={task.status} size="small" />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Task Details Card */}
        <View style={styles.card}>
          <Text style={styles.taskTitle}>{task.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MapPin size={14} color={colors.textSecondary} />
              <Text style={styles.metaText}>{task.location?.address || 'Site Location'}</Text>
            </View>
          </View>

          <Text style={styles.description}>{task.description}</Text>

          <View style={styles.badgesRow}>
            <PriorityBadge priority={task.priority} size="medium" />
            <Text style={styles.categoryBadge}>
              {task.category?.name || task.category || 'General'}
            </Text>
            {task.isEscalated && (
              <View style={styles.escalatedPill}>
                <Text style={styles.escalatedPillText}>⚡ SLA ESCALATED</Text>
              </View>
            )}
          </View>
        </View>

        {/* Primary Action Buttons */}
        <View style={styles.actionGrid}>
          {task.status === 'assigned' && (
            <TouchableOpacity
              style={styles.startWorkBtn}
              onPress={handleStartWork}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              {actionLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Play size={18} color={colors.white} fill={colors.white} />
                  <Text style={styles.startWorkBtnText}>Start Field Work</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {task.status === 'in_progress' && (
            <>
              <TouchableOpacity
                style={styles.resolveBtn}
                onPress={() => {
                  setShowResolveForm(!showResolveForm);
                  setShowProgressForm(false);
                }}
                activeOpacity={0.8}
              >
                <CheckCircle size={18} color={colors.white} />
                <Text style={styles.resolveBtnText}>
                  {showResolveForm ? 'Hide Resolution Form' : 'Submit Completion Proof'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.progressBtn}
                onPress={() => {
                  setShowProgressForm(!showProgressForm);
                  setShowResolveForm(false);
                }}
                activeOpacity={0.8}
              >
                <FileText size={16} color={colors.primaryLight} />
                <Text style={styles.progressBtnText}>
                  {showProgressForm ? 'Hide Progress Log' : 'Add Interim Progress Log'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Progress Log Form */}
        {showProgressForm && (
          <View style={styles.formCard}>
            <Text style={styles.formCardTitle}>📝 Interim Progress Log</Text>

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What work was performed today? (e.g. Cleared debris, dug trench)"
              placeholderTextColor={colors.textDim}
              multiline
              value={progressNote}
              onChangeText={setProgressNote}
            />

            <TextInput
              style={styles.input}
              placeholder="Materials used (comma-separated, e.g. 2 bags cement, asphalt)"
              placeholderTextColor={colors.textDim}
              value={materialsUsed}
              onChangeText={setMaterialsUsed}
            />

            <TouchableOpacity
              style={styles.submitFormBtn}
              onPress={handleSubmitProgress}
              disabled={actionLoading}
            >
              <Text style={styles.submitFormBtnText}>Record Progress Log</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Resolution Proof Form */}
        {showResolveForm && (
          <View style={[styles.formCard, styles.formCardResolve]}>
            <Text style={[styles.formCardTitle, { color: colors.accentLight }]}>
              📸 Resolution Proof & Verification
            </Text>

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe work completed (min. 10 chars, e.g. Road surface patched and sealed)"
              placeholderTextColor={colors.textDim}
              multiline
              value={resolutionSummary}
              onChangeText={setResolutionSummary}
            />

            <TextInput
              style={styles.input}
              placeholder="Final materials used (e.g. 50kg cold mix, primer)"
              placeholderTextColor={colors.textDim}
              value={materialsFinal}
              onChangeText={setMaterialsFinal}
            />

            {/* Photos Strip */}
            <Text style={styles.subLabel}>Attach Completion Photos (Mandatory)</Text>
            <View style={styles.photoActions}>
              <TouchableOpacity
                style={styles.photoBtn}
                onPress={() => handleAddProofPhoto(true)}
              >
                <Camera size={18} color={colors.accentLight} />
                <Text style={styles.photoBtnText}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.photoBtn}
                onPress={() => handleAddProofPhoto(false)}
              >
                <ImageIcon size={18} color={colors.accentLight} />
                <Text style={styles.photoBtnText}>Gallery</Text>
              </TouchableOpacity>
            </View>

            {resolutionPhotos.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
                {resolutionPhotos.map((uri, idx) => (
                  <View key={idx} style={styles.photoThumbContainer}>
                    <Image source={{ uri }} style={styles.photoThumb} />
                    <TouchableOpacity
                      style={styles.deletePhotoBtn}
                      onPress={() =>
                        setResolutionPhotos((prev) => prev.filter((_, i) => i !== idx))
                      }
                    >
                      <X size={12} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              style={[styles.submitFormBtn, { backgroundColor: colors.accent }]}
              onPress={handleResolveTask}
              disabled={actionLoading}
            >
              <Text style={styles.submitFormBtnText}>Confirm & Complete Task</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Internal Staff Notes */}
        <View style={styles.card}>
          <View style={styles.internalHeader}>
            <Lock size={14} color={colors.warningLight} />
            <Text style={styles.internalTitle}>Internal Staff Notes (Staff Only)</Text>
          </View>

          <View style={styles.noteInputRow}>
            <TextInput
              style={styles.noteInput}
              placeholder="Private note for dispatch or supervisor..."
              placeholderTextColor={colors.textDim}
              value={internalNote}
              onChangeText={setInternalNote}
            />
            <TouchableOpacity
              style={styles.noteSubmitBtn}
              onPress={handleAddInternalNote}
              disabled={submittingNote}
            >
              {submittingNote ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Send size={14} color={colors.white} />
              )}
            </TouchableOpacity>
          </View>
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
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: 4,
  },
  topBarTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  taskTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  description: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    color: colors.textMuted,
    fontSize: 12,
    backgroundColor: colors.surfaceCard,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  escalatedPill: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  escalatedPillText: {
    color: colors.dangerLight,
    fontSize: 10,
    fontWeight: '800',
  },
  actionGrid: {
    gap: 10,
  },
  startWorkBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startWorkBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  resolveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  resolveBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  progressBtn: {
    backgroundColor: colors.surfaceCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  progressBtnText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 16,
    gap: 10,
  },
  formCardResolve: {
    borderColor: colors.accent,
  },
  formCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryLight,
  },
  input: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.text,
    fontSize: 13,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  submitFormBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  submitFormBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  subLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  photoActions: {
    flexDirection: 'row',
    gap: 8,
  },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 8,
    paddingVertical: 10,
  },
  photoBtnText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  photoRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  photoThumbContainer: {
    position: 'relative',
    marginRight: 8,
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  deletePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  internalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  internalTitle: {
    color: colors.warningLight,
    fontSize: 12,
    fontWeight: '700',
  },
  noteInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noteInput: {
    flex: 1,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.text,
    fontSize: 13,
  },
  noteSubmitBtn: {
    backgroundColor: colors.warning,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default WorkerTaskActionScreen;
