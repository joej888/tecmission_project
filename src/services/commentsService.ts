import { connectToDatabase, disconnectFromDatabase, getDatabaseClient } from '../config/database';
import { Comment, CommentRow } from '../models/comments';
import { v4 as uuidv4 } from 'uuid';

// Helper function to map Scylla DB Row to CommentRow
const mapDbRowToCommentRow = (row: any): CommentRow => ({
  id: row.id,
  video_id: row.video_id,
  user_id: row.user_id,
  content: row.content,
  likes: row.likes,
  dislikes: row.dislikes,
  created_at: row.created_at,
  parent_comment_id: row.parent_comment_id,
  reply_count: row.reply_count
});

// Helper function to map CommentRow to Comment
const mapRowToComment = (row: CommentRow): Comment => ({
  id: row.id,
  videoId: row.video_id,
  userId: row.user_id,
  content: row.content,
  likes: row.likes,
  dislikes: row.dislikes,
  createdAt: row.created_at,
  parentCommentId: row.parent_comment_id,
  replyCount: row.reply_count
});

// Get all comments for a video
export const getCommentsByVideoId = async (videoId: string): Promise<Comment[]> => {
  const client = await connectToDatabase();
  const query = 'SELECT * FROM comments WHERE video_id = ?';
  const result = await client.execute(query, [videoId]);
  return result.rows.map(mapDbRowToCommentRow).map(mapRowToComment);
};

// Get specific comment by ID
export const getCommentById = async (commentId: string): Promise<Comment | null> => {
  const client = await connectToDatabase();
  const query = 'SELECT * FROM comments WHERE id = ?';
  const result = await client.execute(query, [commentId]);
  if (result.rows.length === 0) return null;
  return mapRowToComment(mapDbRowToCommentRow(result.rows[0]));
};


// Create new comment
export const createComment = async (comment: Omit<CommentRow, 'id' | 'created_at'>): Promise<CommentRow> => {
  const client = await connectToDatabase();
  const newCommentRow: CommentRow = {
    id: uuidv4(),
    created_at: new Date(),
    ...comment,
  };

  const query = `
    INSERT INTO comments (id, video_id, user_id, content, likes, dislikes, created_at, parent_comment_id, reply_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await client.execute(query, [
    newCommentRow.id,
    newCommentRow.video_id,
    newCommentRow.user_id,
    newCommentRow.content,
    newCommentRow.likes,
    newCommentRow.dislikes,
    newCommentRow.created_at,
    newCommentRow.parent_comment_id || null,
    newCommentRow.reply_count
  ]);
  if (newCommentRow.parent_comment_id) {
    await increaseReplyCount(newCommentRow.parent_comment_id);
  }

  return newCommentRow;

};

// Delete comment
export const deleteComment = async (commentId: string): Promise<void> => {
  const client = await connectToDatabase();
  const queryRow = 'SELECT parent_comment_id FROM comments WHERE id = ?';
  const result = await client.execute(queryRow, [commentId]);
  if (!result.rows[0]) {
    throw new Error(`Comment with id ${commentId} not found`);
  }
  await decreaseReplyCount(result.rows[0].parent_comment_id);
  const query = 'DELETE FROM comments WHERE id = ?';
  await client.execute(query, [commentId]);
};

// Get replies for a comment
export const getReplies = async (parentCommentId: string): Promise<Comment[]> => {
  const client = await connectToDatabase();
  const query = 'SELECT * FROM comments WHERE parent_comment_id = ?';
  const result = await client.execute(query, [parentCommentId]);
  return result.rows.map(mapDbRowToCommentRow).map(mapRowToComment);
};

export const increaseReplyCount = async (parentCommentId: string): Promise<void> => {
  const client = await connectToDatabase();

  // Read current reply_count
  const selectQuery = 'SELECT reply_count FROM comments WHERE id = ?';
  const result = await client.execute(selectQuery, [parentCommentId]);

  // Check if comment exists
  if (!result.rows[0]) {
    throw new Error(`Comment with id ${parentCommentId} not found`);
  }
  let currentCount = result.rows[0].reply_count.toNumber();

  currentCount = currentCount + 1; // Increment reply count ++
  // Update with new value
  const updateQuery = 'UPDATE comments SET reply_count = ? WHERE id = ?';
  await client.execute(
    'UPDATE comments SET reply_count = ? WHERE id = ?',
    [currentCount, parentCommentId],
    { hints: ['bigint', 'uuid'], prepare: true }
  )

};

export const decreaseReplyCount = async (parentCommentId: string): Promise<void> => {
  const client = await connectToDatabase();

  // Read current reply_count
  const selectQuery = 'SELECT reply_count FROM comments WHERE id = ?';
  const result = await client.execute(selectQuery, [parentCommentId]);

  // Check if comment exists
  if (!result.rows[0]) {
    throw new Error(`Comment with id ${parentCommentId} not found`);
  }
  let currentCount = result.rows[0].reply_count.toNumber();
  if (currentCount > 0) {
    currentCount = currentCount - 1; // Decrement reply count --
    await client.execute(
      'UPDATE comments SET reply_count = ? WHERE id = ?',
      [currentCount, parentCommentId],
      { hints: ['bigint', 'uuid'], prepare: true }
    )
  }
};


export const likeIncrement = async (commentId: string): Promise<void> => {
  const client = await connectToDatabase();

  // Read current likes
  const selectQuery = 'SELECT likes FROM comments WHERE id = ?';
  const result = await client.execute(selectQuery, [commentId]);

  // Check if comment exists
  if (!result.rows[0]) {
    throw new Error(`Comment with id ${commentId} not found`);
  }
  let likesCount = result.rows[0].likes.toNumber();

  likesCount = likesCount + 1; 
  await client.execute(
    'UPDATE comments SET likes = ? WHERE id = ?',
    [likesCount, commentId],
    { hints: ['bigint', 'uuid'], prepare: true }
  )

};

export const likeDecrement = async (commentId: string): Promise<void> => {
  const client = await connectToDatabase();

  // Read current likes
  const selectQuery = 'SELECT likes FROM comments WHERE id = ?';
  const result = await client.execute(selectQuery, [commentId]);

  // Check if comment exists
  if (!result.rows[0]) {
    throw new Error(`Comment with id ${commentId} not found`);
  }
  let likesCount = result.rows[0].likes.toNumber();
  if (likesCount > 0) {
    likesCount = likesCount - 1; 
    await client.execute(
      'UPDATE comments SET likes = ? WHERE id = ?',
      [likesCount, commentId],
      { hints: ['bigint', 'uuid'], prepare: true }
    )
  }
};

export const dislikeIncrement = async (commentId: string): Promise<void> => {
  const client = await connectToDatabase();

  // Read current dislike
  const selectQuery = 'SELECT dislikes FROM comments WHERE id = ?';
  const result = await client.execute(selectQuery, [commentId]);

  // Check if exists
  if (!result.rows[0]) {
    throw new Error(`Comment with id ${commentId} not found`);
  }
  let dislikesCount = result.rows[0].dislikes.toNumber();

  dislikesCount = dislikesCount + 1;
  await client.execute(
    'UPDATE comments SET dislikes = ? WHERE id = ?',
    [dislikesCount, commentId],
    { hints: ['bigint', 'uuid'], prepare: true }
  )

};

export const dislikeDecrement = async (commentId: string): Promise<void> => {
  const client = await connectToDatabase();

  // Read current reply_count
  const selectQuery = 'SELECT dislikes FROM comments WHERE id = ?';
  const result = await client.execute(selectQuery, [commentId]);

  // Check if comment exists
  if (!result.rows[0]) {
    throw new Error(`Comment with id ${commentId} not found`);
  }
  let dislikesCount = result.rows[0].dislikes.toNumber();
  if (dislikesCount > 0) {
    dislikesCount = dislikesCount - 1;
    await client.execute(
      'UPDATE comments SET dislikes = ? WHERE id = ?',
      [dislikesCount, commentId],
      { hints: ['bigint', 'uuid'], prepare: true }
    )
  }
};
