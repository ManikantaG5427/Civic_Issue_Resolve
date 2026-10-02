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
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import apiClient from '../../config/api';
import { colors } from '../../config/theme';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import {
  MapPin,
  Clock,
  ThumbsUp,
  Bookmark,
  CheckCircle2,
  AlertOctagon,
  MessageSquare,
  Send,
  Star,
  ChevronLeft,
  Share2,
} from 'lucide-react-native';

const IssueDetailScreen = ({ route, navigation }) => {
  const { issueId } = route.params || {};
  const { user } = useAuth();
  const { joinIssueRoom, leaveIssueRoom, socket } = useSocket();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [upvoting, setUpvoting] = useState(false);
  const [following, setFollowing] = useState(false);

  // Rating & Reopen state
  const [rating, setRating] = useState(5);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [showReopenInput, setShowReopenInput] = useState(false);
  const [submittingVerification, setSubmittingVerification] = useState(false);

  const fetchIssueDetails = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/issues/${issueId}`);
      setIssue(res.data.data);

      // Fetch comments
      try {
        const commentRes = await apiClient.get(`/issues/${issueId}/comments`);
        setComments(commentRes.data.data || []);
      } catch (e) {
        // Comments fetch optional
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not load issue details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (issueId) {
      fetchIssueDetails();
      joinIssueRoom(issueId);

      // Listen for live issue status changes
      if (socket) {
        const handleStatusChange = (data) => {
          if (data.issueId === issueId || data.issue?._id === issueId) {
            fetchIssueDetails();
          }
        };

        const handleNewComment = (newComment) => {
          setComments((prev) => [...prev, newComment]);
        };

        socket.on('issue:status_changed', handleStatusChange);
        socket.on('issue:comment_added', handleNewComment);

        return () => {
          socket.off('issue:status_changed', handleStatusChange);
          socket.off('issue:comment_added', handleNewComment);
          leaveIssueRoom(issueId);
        };
      }
    }
  }, [issueId]);

  const handleUpvote = async () => {
    try {
      setUpvoting(true);
      const res = await apiClient.post(`/issues/${issueId}/upvote`);
      setIssue((prev) => ({
        ...prev,
        upvoteCount: res.data.data?.upvoteCount ?? (prev.upvoteCount || 0) + 1,
      }));
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not upvote issue.');
    } finally {
      setUpvoting(false);
    }
  };

  const handleFollow = async () => {
    try {
      setFollowing(true);
      const res = await apiClient.post(`/issues/${issueId}/follow`);
      Alert.alert('Subscribed', res.data.message || 'Notification alerts updated.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not follow issue.');
    } finally {
      setFollowing(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      setSubmittingComment(true);
      const res = await apiClient.post(`/issues/${issueId}/comments`, {
        content: commentText.trim(),
        isInternal: false,
      });
      setComments((prev) => [...prev, res.data.data]);
      setCommentText('');
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not post comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleConfirmResolution = async () => {
    try {
      setSubmittingVerification(true);
      await apiClient.post(`/issues/${issueId}/confirm-resolution`, {
        rating,
        feedback: reviewFeedback.trim(),
      });
      Alert.alert('Thank You!', 'Your rating and confirmation have been recorded.');
      fetchIssueDetails();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to confirm resolution.');
    } finally {
      setSubmittingVerification(false);
    }
  };

  const handleReopenIssue = async () => {
    if (!reopenReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason why this issue remains unresolved.');
      return;
    }
    try {
      setSubmittingVerification(true);
      await apiClient.post(`/issues/${issueId}/reopen`, {
        reason: reopenReason.trim(),
      });
      Alert.alert('Issue Reopened', 'The issue has been flagged back to city dispatch for rework.');
      setShowReopenInput(false);
      fetchIssueDetails();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to reopen issue.');
    } finally {
      setSubmittingVerification(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!issue) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Issue not found or inaccessible.</Text>
      </View>
    );
  }

  const isReporter = issue.reporter?._id === user?.id || issue.reporter === user?.id;
  const isVerificationPending = issue.status === 'resolved_verification_pending';

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
        <Text style={styles.topBarTitle}>
          {issue.trackingNumber || 'CIVIC-REPORT'}
        </Text>
        <View style={styles.topBarRight}>
          <StatusBadge status={issue.status} size="small" />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Details Card */}
        <View style={styles.card}>
          <Text style={styles.issueTitle}>{issue.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MapPin size={14} color={colors.textSecondary} />
              <Text style={styles.metaText}>{issue.location?.address || issue.serviceArea?.name || 'Municipal Area'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={14} color={colors.textSecondary} />
              <Text style={styles.metaText}>
                {new Date(issue.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>

          <Text style={styles.description}>{issue.description}</Text>

          <View style={styles.badgesRow}>
            <PriorityBadge priority={issue.priority} size="medium" />
            <Text style={styles.categoryBadge}>
              {issue.category?.name || issue.category || 'General'}
            </Text>
            {issue.isEscalated && (
              <View style={styles.escalatedPill}>
                <Text style={styles.escalatedPillText}>⚡ SLA ESCALATED</Text>
              </View>
            )}
          </View>

          {/* Social Toolbar */}
          <View style={styles.socialBar}>
            <TouchableOpacity style={styles.socialBtn} onPress={handleUpvote} disabled={upvoting}>
              <ThumbsUp size={16} color={colors.primaryLight} />
              <Text style={styles.socialBtnText}>Upvote ({issue.upvoteCount || 0})</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialBtn} onPress={handleFollow} disabled={following}>
              <Bookmark size={16} color={colors.secondaryLight} />
              <Text style={styles.socialBtnText}>Follow Updates</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Citizen Verification & Reopen Action Banner */}
        {isVerificationPending && isReporter && (
          <View style={styles.verificationCard}>
            <View style={styles.verHeader}>
              <CheckCircle2 size={20} color={colors.accent} />
              <Text style={styles.verTitle}>Resolution Verification Required</Text>
            </View>
            <Text style={styles.verDesc}>
              The field team has marked this issue as resolved. Please review the proof below and rate the work.
            </Text>

            {!showReopenInput ? (
              <View style={styles.rateSection}>
                <Text style={styles.rateLabel}>Rate Service Quality (1 - 5 Stars):</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setRating(star)}>
                      <Star
                        size={28}
                        color={star <= rating ? '#fbbf24' : '#475569'}
                        fill={star <= rating ? '#fbbf24' : 'transparent'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  style={styles.feedbackInput}
                  placeholder="Optional review feedback..."
                  placeholderTextColor={colors.textDim}
                  value={reviewFeedback}
                  onChangeText={setReviewFeedback}
                />

                <View style={styles.verActions}>
                  <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={handleConfirmResolution}
                    disabled={submittingVerification}
                  >
                    {submittingVerification ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <Text style={styles.confirmBtnText}>Accept & Close Report</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.reopenToggleBtn}
                    onPress={() => setShowReopenInput(true)}
                  >
                    <Text style={styles.reopenToggleText}>Issue Not Fixed? Reopen</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.reopenSection}>
                <Text style={styles.reopenLabel}>Describe why the issue is not fixed:</Text>
                <TextInput
                  style={[styles.feedbackInput, { minHeight: 60 }]}
                  placeholder="Explain what is still broken..."
                  placeholderTextColor={colors.textDim}
                  multiline
                  value={reopenReason}
                  onChangeText={setReopenReason}
                />

                <View style={styles.verActions}>
                  <TouchableOpacity
                    style={styles.reopenConfirmBtn}
                    onPress={handleReopenIssue}
                    disabled={submittingVerification}
                  >
                    <Text style={styles.reopenConfirmText}>Submit Reopen Request</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.reopenToggleBtn}
                    onPress={() => setShowReopenInput(false)}
                  >
                    <Text style={styles.reopenToggleText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Evidence Photos */}
        {(issue.evidence?.length > 0 || issue.resolutionProof?.photos?.length > 0) && (
          <View style={styles.card}>
            <Text style={styles.sectionHeading}>Photo Evidence</Text>

            {issue.evidence?.length > 0 && (
              <View style={styles.photoBlock}>
                <Text style={styles.photoSubheading}>Initial Report Evidence</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
                  {issue.evidence.map((p, idx) => (
                    <Image
                      key={idx}
                      source={{ uri: p.url }}
                      style={styles.photoThumb}
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {issue.resolutionProof?.photos?.length > 0 && (
              <View style={[styles.photoBlock, { marginTop: 12 }]}>
                <Text style={[styles.photoSubheading, { color: colors.accentLight }]}>
                  Worker Resolution Proof
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
                  {issue.resolutionProof.photos.map((p, idx) => (
                    <Image
                      key={idx}
                      source={{ uri: p.url || p }}
                      style={[styles.photoThumb, styles.resolvedPhotoThumb]}
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* Comments Section */}
        <View style={styles.card}>
          <View style={styles.commentsHeader}>
            <MessageSquare size={16} color={colors.primaryLight} />
            <Text style={styles.sectionHeading}>Discussion & Updates ({comments.length})</Text>
          </View>

          {comments.length === 0 ? (
            <Text style={styles.noCommentsText}>No public comments yet. Post an update below.</Text>
          ) : (
            <View style={styles.commentsList}>
              {comments.map((cmt, idx) => (
                <View key={cmt._id || idx} style={styles.commentBubble}>
                  <View style={styles.commentTop}>
                    <Text style={styles.commentAuthor}>
                      {cmt.author?.name || cmt.authorName || 'Citizen / Staff'}
                    </Text>
                    <Text style={styles.commentTime}>
                      {new Date(cmt.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <Text style={styles.commentContent}>{cmt.content}</Text>
                </View>
              ))}
            </View>
          )}

          {/* New Comment Input */}
          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment or inquiry..."
              placeholderTextColor={colors.textDim}
              value={commentText}
              onChangeText={setCommentText}
            />
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={handleAddComment}
              disabled={submittingComment}
            >
              {submittingComment ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Send size={16} color={colors.white} />
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
    padding: 20,
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
  topBarRight: {
    flexDirection: 'row',
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
  issueTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  description: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
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
  socialBar: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceCard,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  socialBtnText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  verificationCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  verHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verTitle: {
    color: colors.accentLight,
    fontWeight: '700',
    fontSize: 15,
  },
  verDesc: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  rateSection: {
    gap: 10,
    marginTop: 4,
  },
  rateLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  feedbackInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.text,
    fontSize: 13,
  },
  verActions: {
    gap: 8,
    marginTop: 4,
  },
  confirmBtn: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  reopenToggleBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  reopenToggleText: {
    color: colors.dangerLight,
    fontSize: 12,
    fontWeight: '600',
  },
  reopenSection: {
    gap: 8,
  },
  reopenLabel: {
    color: colors.dangerLight,
    fontSize: 12,
    fontWeight: '600',
  },
  reopenConfirmBtn: {
    backgroundColor: colors.danger,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  reopenConfirmText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  photoBlock: {
    gap: 6,
  },
  photoSubheading: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  photoRow: {
    flexDirection: 'row',
  },
  photoThumb: {
    width: 110,
    height: 90,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  resolvedPhotoThumb: {
    borderColor: colors.accent,
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  noCommentsText: {
    color: colors.textDim,
    fontSize: 12,
    fontStyle: 'italic',
    marginVertical: 6,
  },
  commentsList: {
    gap: 8,
    marginBottom: 12,
  },
  commentBubble: {
    backgroundColor: colors.surfaceCard,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  commentTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentAuthor: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: '700',
  },
  commentTime: {
    color: colors.textDim,
    fontSize: 10,
  },
  commentContent: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  commentInput: {
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
  sendBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default IssueDetailScreen;
