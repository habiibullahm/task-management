import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';
import { commentService } from '@/services/comment.service';
import { handleApiError } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import type { Comment } from '@/types';

interface TaskCommentsProps {
  taskId: string;
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function TaskComments({ taskId }: TaskCommentsProps) {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const loadComments = async () => {
    setLoading(true);
    try {
      const data = await commentService.getTaskComments(taskId);
      setComments(data);
    } catch (error) {
      toast.error(handleApiError(error, 'Failed to load comments'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    setSubmitting(true);
    try {
      const created = await commentService.createComment({
        taskId,
        content: content.trim(),
      });
      setComments((prev) => [...prev, created]);
      setContent('');
      toast.success('Comment added');
    } catch (error) {
      toast.error(handleApiError(error, 'Failed to add comment'));
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editContent.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    setSavingEdit(true);
    try {
      const updated = await commentService.updateComment(commentId, {
        content: editContent.trim(),
      });
      setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
      cancelEdit();
      toast.success('Comment updated');
    } catch (error) {
      toast.error(handleApiError(error, 'Failed to update comment'));
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      await commentService.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success('Comment deleted');
    } catch (error) {
      toast.error(handleApiError(error, 'Failed to delete comment'));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments</CardTitle>
        <CardDescription>Discuss this task with people who can access it.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-2">
          <Label htmlFor="new-comment">Add a comment</Label>
          <textarea
            id="new-comment"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            disabled={submitting}
            placeholder="Write a comment…"
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting || !content.trim()}>
              {submitting ? 'Posting…' : 'Post comment'}
            </Button>
          </div>
        </form>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading comments…</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {comments.map((comment) => {
              const author = comment.user
                ? `${comment.user.firstName} ${comment.user.lastName}`
                : 'Unknown user';
              const isAuthor = comment.userId === user?.id;
              const isEditing = editingId === comment.id;

              return (
                <li key={comment.id} className="space-y-2 p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-medium">{author}</p>
                    <p className="text-xs text-muted-foreground">{formatWhen(comment.createdAt)}</p>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        disabled={savingEdit}
                        aria-label="Edit comment"
                        className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={savingEdit}
                          onClick={() => handleSaveEdit(comment.id)}
                        >
                          {savingEdit ? 'Saving…' : 'Save'}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={savingEdit}
                          onClick={cancelEdit}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm">{comment.content}</p>
                  )}

                  {isAuthor && !isEditing ? (
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => startEdit(comment)}>
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDelete(comment.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
