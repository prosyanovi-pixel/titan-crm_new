import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/lib/i18n';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Trash2, MessageSquare } from 'lucide-react';
import { useConfirm } from '@/components/ui/confirm-dialog';

interface Comment {
  id: number;
  entityType: string;
  entityId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  userName: string;
  userInitials: string;
  userAvatar: string;
  userRole: string;
}

interface CommentsSectionProps {
  entityType: 'task' | 'contract' | 'project' | 'contractor' | string;
  entityId: string;
}

export function CommentsSection({ entityType, entityId }: CommentsSectionProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();
  const [content, setContent] = useState('');

  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('titan_user_id') : null;

  const queryKey = ['comments', entityType, entityId];

  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey,
    queryFn: async () => {
      const response = await api.get(`/comments/${entityType}/${entityId}`);
      return response as Comment[];
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (newContent: string) => {
      const response = await api.post(`/comments/${entityType}/${entityId}`, {
        content: newContent,
        userId: currentUserId,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setContent('');
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/comments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    addCommentMutation.mutate(content.trim());
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirm({
      description: t('components.comments.delete_confirm'),
    });
    if (isConfirmed) {
      deleteCommentMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="py-4 animate-pulse h-20 bg-muted rounded-xl" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b pb-2">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">{t('components.comments.title')} ({comments.length})</h3>
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        {comments.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            {t('components.comments.empty')}
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-4 p-4 rounded-xl bg-card border group">
              <Avatar className="w-10 h-10 border shadow-sm">
                <AvatarImage src={comment.userAvatar} />
                <AvatarFallback>{comment.userInitials || '?'}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{comment.userName || 'Unknown User'}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleString('ru-RU')}
                    </span>
                  </div>
                  {(currentUserId === comment.userId || currentUserId === 'admin') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                      onClick={() => handleDelete(comment.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="text-sm whitespace-pre-wrap text-foreground/90">
                  {comment.content}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3 items-start mt-4">
        <Avatar className="w-10 h-10 border shadow-sm flex-shrink-0">
          <AvatarFallback>{currentUserId?.substring(0, 2).toUpperCase() || 'Me'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 flex flex-col gap-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('components.comments.placeholder')}
            className="min-h-[80px] resize-y rounded-xl"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSubmit(e);
              }
            }}
          />
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground">Cmd/Ctrl + Enter</span>
            <Button 
              type="submit" 
              disabled={!content.trim() || addCommentMutation.isPending}
              className="rounded-full gap-2 px-5"
            >
              <Send className="w-4 h-4" />
              {t('components.comments.send')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
