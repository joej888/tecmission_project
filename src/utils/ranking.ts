/**
 * Top Comments Ranking Algorithm - Functional Approach
 * Simple scoring system: score = max(0, (likes - dislikes)) + recency_factor + reply_boost
 */

export interface Comment {
  id: string;
  videoId: string;
  userId: string;
  content: string;
  parentCommentId?: string | undefined;
  likes: number;
  dislikes: number;
  replyCount: number;
  createdAt: Date;
}

export interface RankedComment extends Comment {
  score: number;
  timeAgo: string;
  netScore: number; // likes - dislikes
  replies?: RankedComment[]; // nested replies for display
}

/**
 * Calculate recency factor based on how recent the comment is
 * More recent comments get higher scores
 */
function calculateRecencyFactor(createdAt: Date): number {
  const now = new Date();
  const hoursSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  
  // Recency scoring:
  // 0-1 hour: 10 points
  // 1-6 hours: 8 points  
  // 6-24 hours: 6 points
  // 1-7 days: 4 points
  // 1-4 weeks: 2 points
  // 4+ weeks: 0 points
  
  if (hoursSinceCreated <= 1) return 10;
  if (hoursSinceCreated <= 6) return 8;
  if (hoursSinceCreated <= 24) return 6;
  if (hoursSinceCreated <= 168) return 4; // 7 days
  if (hoursSinceCreated <= 672) return 2; // 4 weeks
  return 0;
}

/**
 * Calculate net score (likes - dislikes)
 */
function calculateNetScore(comment: Comment): number {
  return comment.likes - comment.dislikes;
}

/**
 * Calculate final score for a comment
 * Formula: score = max(0, (likes - dislikes)) + recency_factor + reply_boost
 */
function calculateScore(comment: Comment): number {
  const netScore = calculateNetScore(comment);
  const recencyFactor = calculateRecencyFactor(comment.createdAt);
  const replyBoost = Math.min(comment.replyCount * 0.5, 5); // Max 5 bonus points from replies
  
  // Prevent heavily disliked comments from ranking high due to recency/replies
  // Use max(0, netScore) so negative net scores don't get boosts
  return Math.max(0, netScore) + recencyFactor + replyBoost;
}

/**
 * Format timestamp to human-readable relative time
 */
function formatTimeAgo(createdAt: Date): string {
  const now = new Date();
  const secondsAgo = Math.floor((now.getTime() - createdAt.getTime()) / 1000);
  
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 }
  ];
  
  for (const interval of intervals) {
    const count = Math.floor(secondsAgo / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
    }
  }
  
  return 'just now';
}

/**
 * Rank comments by score (net likes + recency + reply engagement)
 * Returns comments sorted by highest score first
 */
function rankComments(comments: Comment[]): RankedComment[] {
  return comments
    .map(comment => ({
      ...comment,
      netScore: calculateNetScore(comment),
      score: calculateScore(comment),
      timeAgo: formatTimeAgo(comment.createdAt)
    }))
    .sort((a, b) => b.score - a.score); // Sort by score descending
}

/**
 * Get top N comments
 */
function getTopComments(comments: Comment[], limit: number): RankedComment[] {
  const rankedComments = rankComments(comments);
  return rankedComments.slice(0, limit);
}

/**
 * Get comments with their replies in a nested structure
 * Top-level comments are ranked, replies are sorted by time (newest first)
 */
function getCommentsWithReplies(comments: Comment[], topLevelLimit?: number, repliesLimit?: number): RankedComment[] {
  // Separate top-level comments from replies
  const topLevelComments = comments.filter(c => !c.parentCommentId);
  const replies = comments.filter(c => c.parentCommentId);
  
  // Rank top-level comments
  const rankedTopLevel = rankComments(topLevelComments);
  
  // Apply limit to top-level comments if specified and greater than 0
  const limitedTopLevel = (topLevelLimit && topLevelLimit > 0) ? rankedTopLevel.slice(0, topLevelLimit) : rankedTopLevel;
  
  // Attach replies to their parent comments
  return limitedTopLevel.map(comment => {
    const commentReplies = replies
      .filter(r => String(r.parentCommentId) === String(comment.id))
      .map(reply => ({
        ...reply,
        netScore: calculateNetScore(reply),
        score: calculateScore(reply),
        timeAgo: formatTimeAgo(reply.createdAt)
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort replies by newest first
    
    // Apply limit to replies if specified and greater than 0
    const limitedReplies = (repliesLimit && repliesLimit > 0) ? commentReplies.slice(0, repliesLimit) : commentReplies;
    
    return {
      ...comment,
      replies: limitedReplies
    };
  });
}


export {
  calculateRecencyFactor,
  calculateNetScore,
  calculateScore,
  formatTimeAgo,
  rankComments,
  getTopComments,
  getCommentsWithReplies
};