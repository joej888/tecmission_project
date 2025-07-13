export interface Comment {
  id: string;
  videoId: string;
  userId: string;
  content: string;
  likes: number;
  dislikes: number;
  createdAt: Date;
  parentCommentId?: string | undefined;
  replyCount: number;
}

export interface RankedComment extends Comment {
  score: number;
  timeAgo: string;
  netScore: number;
  replies?: RankedComment[];
}

// Database model for Scylla operations
export interface CommentRow {
  id: string;
  video_id: string;
  user_id: string;
  content: string;
  likes: number;
  dislikes: number;
  created_at: Date;
  parent_comment_id?: string;
  reply_count: number;
}
