import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import apiClient from '../../config/api';
import { colors } from '../../config/theme';
import Header from '../../components/Header';
import {
  Camera,
  Image as ImageIcon,
  MapPin,
  Crosshair,
  AlertTriangle,
  CheckCircle,
  ThumbsUp,
  X,
  Send,
} from 'lucide-react-native';

const CATEGORIES = [
  { id: 'roads', name: 'Roads & Potholes' },
  { id: 'waste', name: 'Garbage & Sanitation' },
  { id: 'water', name: 'Water Leakage & Supply' },
  { id: 'electrical', name: 'Streetlights & Electrical' },
  { id: 'drainage', name: 'Storm Drainage' },
  { id: 'parks', name: 'Public Parks & Trees' },
];

const PRIORITIES = [
  { id: 'low', name: 'Low' },
  { id: 'medium', name: 'Medium' },
  { id: 'high', name: 'High' },
  { id: 'emergency', name: 'Emergency' },
];

const ReportIssueScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [priority, setPriority] = useState('medium');
  const [address, setAddress] = useState('Kukatpally Main Rd, Hyderabad');
  const [latitude, setLatitude] = useState(17.485);
  const [longitude, setLongitude] = useState(78.3968);
  const [imageUri, setImageUri] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [duplicateCandidates, setDuplicateCandidates] = useState([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  // Check nearby duplicates whenever coordinates change
  useEffect(() => {
    const checkDuplicates = async () => {
      if (!latitude || !longitude) return;
      try {
        setCheckingDuplicates(true);
        const res = await apiClient.get(
          `/issues/nearby-duplicates?latitude=${latitude}&longitude=${longitude}&maxDistanceMeters=500`
        );
        const items = res.data.data || [];
        setDuplicateCandidates(items);
      } catch (err) {
        // Silently skip duplicate check if not reachable
      } finally {
        setCheckingDuplicates(false);
      }
    };

    const timeout = setTimeout(checkDuplicates, 600);
    return () => clearTimeout(timeout);
  }, [latitude, longitude]);

  // Request GPS Location
  const handleGetLocation = async () => {
    try {
      setLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLatitude(Number(location.coords.latitude.toFixed(6)));
      setLongitude(Number(location.coords.longitude.toFixed(6)));

      // Reverse geocode
      try {
        const geocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        if (geocode && geocode.length > 0) {
          const g = geocode[0];
          const fullAddress = [g.name, g.street, g.city, g.region].filter(Boolean).join(', ');
          if (fullAddress) setAddress(fullAddress);
        }
      } catch (e) {
        // Keep default address if reverse geocode fails
      }
    } catch (err) {
      Alert.alert('Location Error', 'Unable to fetch current GPS coordinates.');
    } finally {
      setLoadingLocation(false);
    }
  };

  // Pick Image from Gallery
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera roll permission is required to select photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Take photo with camera
  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Upvote duplicate instead of filing new
  const handleUpvoteDuplicate = async (dupId) => {
    try {
      await apiClient.post(`/issues/${dupId}/upvote`);
      await apiClient.post(`/issues/${dupId}/follow`);
      Alert.alert(
        'Upvoted & Following!',
        'You have upvoted this existing report. You will receive live notifications when its status changes.',
        [{ text: 'View Report', onPress: () => navigation.navigate('IssueDetail', { issueId: dupId }) }]
      );
    } catch (err) {
      Alert.alert('Action Failed', err.message || 'Could not upvote report.');
    }
  };

  // Submit Issue
  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Validation Error', 'Please enter a title and description for this issue.');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        location: {
          address: address.trim(),
          coordinates: [longitude, latitude],
        },
        evidence: imageUri
          ? [
              {
                url: imageUri,
                caption: 'Citizen mobile report photo',
                uploadedAt: new Date().toISOString(),
              },
            ]
          : [],
      };

      const res = await apiClient.post('/issues', payload);
      const created = res.data.data;

      Alert.alert(
        'Report Filed Successfully!',
        `Your tracking ID is ${created?.trackingNumber || 'CIVIC-REPORT'}. City dispatch has been notified.`,
        [
          {
            text: 'Track Issue',
            onPress: () =>
              navigation.replace('IssueDetail', { issueId: created?._id || created?.id }),
          },
        ]
      );
    } catch (err) {
      Alert.alert('Submission Failed', err.message || 'Could not submit issue report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Header
        title="Report Civic Issue"
        subtitle="Submit a complaint to your municipal authority"
        navigation={navigation}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Nearby Duplicates Alert Banner */}
        {duplicateCandidates.length > 0 && (
          <View style={styles.duplicateCard}>
            <View style={styles.dupHeader}>
              <AlertTriangle size={18} color={colors.warning} />
              <Text style={styles.dupTitle}>
                {duplicateCandidates.length} Similar Issue(s) Reported Nearby
              </Text>
            </View>
            <Text style={styles.dupDesc}>
              A similar issue was already reported within 500m. Upvoting helps prioritize city action faster!
            </Text>

            {duplicateCandidates.slice(0, 2).map((dup) => (
              <View key={dup._id || dup.id} style={styles.dupItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dupItemTitle} numberOfLines={1}>
                    {dup.title}
                  </Text>
                  <Text style={styles.dupItemDist}>
                    ~{Math.round(dup.distanceMeters || 120)}m away • Status: {dup.status}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.dupUpvoteBtn}
                  onPress={() => handleUpvoteDuplicate(dup._id || dup.id)}
                >
                  <ThumbsUp size={12} color={colors.white} />
                  <Text style={styles.dupUpvoteText}>Upvote</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Issue Title & Description */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>1. Issue Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Deep pothole causing traffic slowdown"
              placeholderTextColor={colors.textDim}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Provide exact location landmarks, severity, and any hazards..."
              placeholderTextColor={colors.textDim}
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />
          </View>
        </View>

        {/* Category & Priority */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>2. Category & Urgency</Text>

          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.chip, category === cat.name && styles.chipActive]}
                onPress={() => setCategory(cat.name)}
              >
                <Text style={[styles.chipText, category === cat.name && styles.chipTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.label, { marginTop: 14 }]}>Priority Level</Text>
          <View style={styles.priorityRow}>
            {PRIORITIES.map((pri) => (
              <TouchableOpacity
                key={pri.id}
                style={[styles.priBtn, priority === pri.id && styles.priBtnActive]}
                onPress={() => setPriority(pri.id)}
              >
                <Text style={[styles.priText, priority === pri.id && styles.priTextActive]}>
                  {pri.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Photo Evidence */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>3. Photo Evidence</Text>

          {imageUri ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImageUri(null)}>
                <X size={16} color={colors.white} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoActions}>
              <TouchableOpacity style={styles.photoBtn} onPress={handleTakePhoto} activeOpacity={0.8}>
                <Camera size={22} color={colors.primaryLight} />
                <Text style={styles.photoBtnText}>Take Live Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.photoBtn} onPress={handlePickImage} activeOpacity={0.8}>
                <ImageIcon size={22} color={colors.secondaryLight} />
                <Text style={styles.photoBtnText}>Upload from Gallery</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* GPS Location Pin */}
        <View style={styles.card}>
          <View style={styles.locationHeader}>
            <Text style={styles.sectionHeading}>4. Location & GPS</Text>
            <TouchableOpacity
              style={styles.gpsBtn}
              onPress={handleGetLocation}
              disabled={loadingLocation}
            >
              {loadingLocation ? (
                <ActivityIndicator size="small" color={colors.primaryLight} />
              ) : (
                <>
                  <Crosshair size={14} color={colors.primaryLight} />
                  <Text style={styles.gpsBtnText}>Get Live GPS</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Street Address / Landmark</Text>
            <View style={styles.inputWithIcon}>
              <MapPin size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.inputInline}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter address"
                placeholderTextColor={colors.textDim}
              />
            </View>
          </View>

          <View style={styles.coordsRow}>
            <Text style={styles.coordsText}>
              Coordinates: {latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E
            </Text>
            {checkingDuplicates && <ActivityIndicator size="small" color={colors.warning} />}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Send size={18} color={colors.white} />
              <Text style={styles.submitButtonText}>Submit Civic Issue Report</Text>
            </>
          )}
        </TouchableOpacity>
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
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipsRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  chip: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.white,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priBtn: {
    flex: 1,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  priBtnActive: {
    backgroundColor: colors.warningGlow,
    borderColor: colors.warning,
  },
  priText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  priTextActive: {
    color: colors.warningLight,
    fontWeight: '700',
  },
  photoActions: {
    flexDirection: 'row',
    gap: 10,
  },
  photoBtn: {
    flex: 1,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 10,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  photoBtnText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  previewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryGlow,
    borderWidth: 1,
    borderColor: colors.primaryDark,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gpsBtnText: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: '700',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  inputInline: {
    flex: 1,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 13,
  },
  coordsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  coordsText: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  duplicateCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  dupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dupTitle: {
    color: colors.warningLight,
    fontWeight: '700',
    fontSize: 13,
  },
  dupDesc: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
  },
  dupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  dupItemTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  dupItemDist: {
    color: colors.textMuted,
    fontSize: 10,
  },
  dupUpvoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dupUpvoteText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
});

export default ReportIssueScreen;
