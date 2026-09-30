import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Lock,
  Globe,
  User,
  HardHat,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { issueAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const getRoleBadge = (role) => {
  switch (role) {
    case 'super_admin':
      return {
        label: 'Super Admin',
        icon: <ShieldAlert className="w-3 h-3 text-rose-400" />,
        color: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
      };
    case 'administrator':
      return {
        label: 'Administrator',
        icon: <ShieldCheck className="w-3 h-3 text-sky-400" />,
        color: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
      };
    case 'field_worker':
      return {
        label: 'Field Specialist',
        icon: <HardHat className="w-3 h-3 text-amber-400" />,
        color: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      };
    default:
      return {
        label: 'Citizen Reporter',
        icon: <User className="w-3 h-3 text-teal-400" />,
        color: 'bg-teal-500/10 text-teal-300 border-teal-500/30',
      };
  }
};

export default function CommentSection({ issueId, initialComments = [], onCommentAdded }) {
  const { user } = useAuth();
  const [comments, setComments] = useState(initialComments);
  const [content, setContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const isStaff = ['field_worker', 'administrator', 'super_admin'].includes(user?.role);

  // Sync if initialComments changes from parent real-time update
  React.useEffect(() => {
    if (initialComments) {
      setComments(initialComments);
    }
  }, [initialComments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content || content.trim().length < 2) {
      setError('Comment must be at least 2 characters.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await issueAPI.addComment(issueId, {
        content: content.trim(),
        isInternal: isStaff ? isInternal : false,
      });

      if (res.data) {
        setComments(res.data.comments || [...comments, res.data.comment]);
        setContent('');
        setIsInternal(false);
        setSuccess(
          res.data.message ||
            (isInternal ? 'Internal staff note recorded' : 'Comment posted successfully')
        );
        if (onCommentAdded) {
          onCommentAdded(res.data);
        }
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Discussion & Municipal Notes</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {comments.length}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Official communication channel between citizens and municipal operational teams.
            </p>
          </div>
        </div>

        {isStaff && (
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
            <Lock className="w-3 h-3" />
            <span>Staff Access Enabled</span>
          </div>
        )}
      </div>

      {/* Success / Error Messages */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Comments Feed */}
      <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <div className="py-8 text-center space-y-2 rounded-2xl bg-slate-950/40 border border-slate-800/60">
            <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400 font-medium">No comments or notes yet.</p>
            <span className="text-[11px] text-slate-500">
              Start the discussion by posting an update or asking a question below.
            </span>
          </div>
        ) : (
          comments.map((comment, index) => {
            const roleBadge = getRoleBadge(comment.authorRole || comment.author?.role);
            const isInternalNote = comment.isInternal;

            return (
              <div
                key={comment._id || index}
                className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                  isInternalNote
                    ? 'bg-amber-950/20 border-amber-500/30 shadow-md shadow-amber-950/30'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      {comment.authorName || comment.author?.name || 'Municipal Official'}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${roleBadge.color}`}
                    >
                      {roleBadge.icon}
                      <span>{roleBadge.label}</span>
                    </span>

                    {isInternalNote && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                        <Lock className="w-2.5 h-2.5" />
                        <span>INTERNAL NOTE</span>
                      </span>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date(comment.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {comment.content}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* New Comment Input Box */}
      <form onSubmit={handleSubmit} className="space-y-3 pt-2">
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder={
              isInternal
                ? 'Write a confidential internal note (visible only to municipal staff & field workers)...'
                : 'Write a public comment or inquiry regarding this civic issue...'
            }
            className={`w-full px-4 py-3 rounded-2xl text-xs placeholder:text-slate-500 focus:outline-none transition resize-none ${
              isInternal
                ? 'bg-amber-950/20 border border-amber-500/40 text-amber-100 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30'
                : 'bg-slate-950 border border-slate-800 text-slate-100 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30'
            }`}
          />
          <div className="absolute right-3 bottom-3 text-[10px] text-slate-500">
            {content.length}/2000
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Internal Note Toggle for Staff */}
          {isStaff ? (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-950"
              />
              <span className="text-xs text-amber-400 font-medium flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>Internal Municipal Note (Staff Only)</span>
              </span>
            </label>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <Globe className="w-3 h-3 text-teal-400" />
              <span>Visible to assigned team and public records</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${
              isInternal
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                : 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-teal-500/20'
            }`}
          >
            {submitting ? (
              <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>{isInternal ? 'Post Internal Note' : 'Post Comment'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
