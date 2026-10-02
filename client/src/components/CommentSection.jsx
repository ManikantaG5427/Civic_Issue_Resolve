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
        icon: <ShieldAlert className="w-3 h-3 text-red-600" />,
        color: 'bg-red-50 text-red-700 border-red-200',
      };
    case 'administrator':
      return {
        label: 'Administrator',
        icon: <ShieldCheck className="w-3 h-3 text-brand-700" />,
        color: 'bg-brand-50 text-brand-700 border-brand-200',
      };
    case 'field_worker':
      return {
        label: 'Field Specialist',
        icon: <HardHat className="w-3 h-3 text-amber-700" />,
        color: 'bg-amber-50 text-amber-800 border-amber-200',
      };
    default:
      return {
        label: 'Citizen Reporter',
        icon: <User className="w-3 h-3 text-civic-700" />,
        color: 'bg-civic-50 text-civic-700 border-civic-200',
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
    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-soft space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-civic-50 text-civic-700 border border-civic-200">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 font-heading">
              <span>Discussion & Municipal Notes</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                {comments.length}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Official communication channel between citizens and municipal operational teams.
            </p>
          </div>
        </div>

        {isStaff && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Staff Access Enabled</span>
          </div>
        )}
      </div>

      {/* Success / Error Messages */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-green-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Comments Feed */}
      <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <div className="py-8 text-center space-y-2 rounded-xl bg-slate-50 border border-dashed border-slate-200">
            <MessageSquare className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-600 font-medium">No comments or notes yet.</p>
            <span className="text-xs text-slate-400">
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
                className={`p-4 rounded-xl border transition-all space-y-2.5 ${
                  isInternalNote
                    ? 'bg-amber-50/70 border-amber-200 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {comment.authorName || comment.author?.name || 'Municipal Official'}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${roleBadge.color}`}
                    >
                      {roleBadge.icon}
                      <span>{roleBadge.label}</span>
                    </span>

                    {isInternalNote && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                        <Lock className="w-2.5 h-2.5 text-amber-700" />
                        <span>INTERNAL NOTE</span>
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 flex items-center gap-1">
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

                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
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
            className={`w-full px-4 py-3 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none transition resize-none ${
              isInternal
                ? 'bg-amber-50/50 border border-amber-300 text-amber-950 focus:border-amber-500 focus:ring-4 focus:ring-amber-100'
                : 'bg-white border border-slate-300 text-slate-900 focus:border-brand-600 focus:ring-4 focus:ring-brand-100'
            }`}
          />
          <div className="absolute right-3 bottom-3 text-xs text-slate-400">
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
                className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-xs text-amber-900 font-semibold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                <span>Internal Municipal Note (Staff Only)</span>
              </span>
            </label>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Globe className="w-3.5 h-3.5 text-civic-600" />
              <span>Visible to assigned team and public records</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${
              isInternal
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-brand-700 hover:bg-brand-800 text-white'
            }`}
          >
            {submitting ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
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
