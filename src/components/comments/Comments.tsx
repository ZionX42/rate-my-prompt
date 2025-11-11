'use client';
import React from 'react';
import CommentList from './CommentList';
import CommentForm from './CommentForm';
import type { CommentThread } from '@/lib/models/comment';

export default function Comments({ promptId, userId }: { promptId: string; userId: string }) {
  const [threads, setThreads] = React.useState<CommentThread[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [replyTo, setReplyTo] = React.useState<string | null>(null);
  const [editTarget, setEditTarget] = React.useState<{ id: string; content: string } | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/prompts/${promptId}/comments`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to fetch comments: ${res.status}`);
      const data = await res.json();
      setThreads(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promptId]);

  async function create(content: string) {
    const res = await fetch(`/api/prompts/${promptId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, content, parentId: replyTo }),
    });
    if (!res.ok) throw new Error('Failed to post comment');
    setReplyTo(null);
    await load();
  }

  async function update(content: string) {
    if (!editTarget) return;
    const res = await fetch(`/api/prompts/${promptId}/comments/${editTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, content }),
    });
    if (!res.ok) throw new Error('Failed to update comment');
    setEditTarget(null);
    await load();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/prompts/${promptId}/comments/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error('Failed to delete comment');
    await load();
  }

  return (
    <section className="card p-6 mb-8">
      <h3 className="text-lg font-semibold text-heading mb-4">Comments</h3>

      {loading && <div className="text-subtext">Loading comments…</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && !error && (
        <>
          <div className="mb-6">
            {editTarget ? (
              <CommentForm
                initial={editTarget.content}
                submitLabel="Save"
                onCancel={() => setEditTarget(null)}
                onSubmit={update}
              />
            ) : (
              <CommentForm placeholder="Write a comment…" submitLabel="Post" onSubmit={create} />
            )}
          </div>

          <CommentList
            threads={threads}
            onReply={(parentId) => setReplyTo(parentId)}
            onEdit={(id, content) => setEditTarget({ id, content })}
            onDelete={(id) => remove(id)}
          />

          {replyTo && (
            <div className="mt-4">
              <div className="text-sm text-subtext mb-2">Replying to a comment</div>
              <CommentForm
                submitLabel="Reply"
                onCancel={() => setReplyTo(null)}
                onSubmit={create}
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}
