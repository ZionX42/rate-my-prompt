import React from 'react';
import { CommentThread } from '@/lib/models/comment';

export type CommentListProps = {
  threads: CommentThread[];
  onReply: (parentId: string) => void;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
};

function CommentItem({
  thread,
  onReply,
  onEdit,
  onDelete,
}: {
  thread: CommentThread;
  onReply: (parentId: string) => void;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
}) {
  const top = thread.comment;
  return (
    <li className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="text-sm text-subtext mb-1">
            <span className="font-medium text-heading">{top.userId}</span>
            <span className="mx-2">•</span>
            <span>{top.createdAt ? new Date(top.createdAt).toLocaleString() : ''}</span>
            {top.isEdited && <span className="ml-2 text-xs">(edited)</span>}
          </div>
          <div className="text-sm text-heading whitespace-pre-wrap">{top.content}</div>
          <div className="mt-2 flex gap-3 text-xs text-subtext">
            <button className="hover:text-heading" onClick={() => onReply(top._id!)}>
              Reply
            </button>
            <button className="hover:text-heading" onClick={() => onEdit(top._id!, top.content)}>
              Edit
            </button>
            <button className="hover:text-heading" onClick={() => onDelete(top._id!)}>
              Delete
            </button>
          </div>
        </div>
      </div>
      {thread.replies.length > 0 && (
        <ul className="mt-3 ml-6 border-l border-border pl-4 space-y-3">
          {thread.replies.map((r) => (
            <li key={r._id} className="">
              <div className="text-sm text-subtext mb-1">
                <span className="font-medium text-heading">{r.userId}</span>
                <span className="mx-2">•</span>
                <span>{r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</span>
                {r.isEdited && <span className="ml-2 text-xs">(edited)</span>}
              </div>
              <div className="text-sm text-heading whitespace-pre-wrap">{r.content}</div>
              <div className="mt-2 flex gap-3 text-xs text-subtext">
                <button className="hover:text-heading" onClick={() => onReply(r._id!)}>
                  Reply
                </button>
                <button className="hover:text-heading" onClick={() => onEdit(r._id!, r.content)}>
                  Edit
                </button>
                <button className="hover:text-heading" onClick={() => onDelete(r._id!)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export default function CommentList({ threads, onReply, onEdit, onDelete }: CommentListProps) {
  if (threads.length === 0) {
    return <div className="text-subtext">No comments yet. Be the first to comment.</div>;
  }
  return (
    <ul className="divide-y divide-border">
      {threads.map((t) => (
        <CommentItem
          key={t.comment._id}
          thread={t}
          onReply={onReply}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
