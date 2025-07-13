import { Request, Response } from 'express';
import {
  likeIncrement,
  likeDecrement,
  dislikeIncrement,
  dislikeDecrement,
  getCommentsByVideoId,
  createComment as createCommentService,
  deleteComment as deleteCommentService,
  getReplies as getRepliesService
} from '../services/commentsService';
import { getTopComments, getCommentsWithReplies, rankComments } from '../utils/ranking';

// GET /api/comments/:videoId - Get all comments for a video
export const getComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { videoId } = req.params;
    const { type, topLevelLimit, repliesLimit } = req.query;

    if (!videoId) {
      res.status(400).json({
        success: false,
        error: 'Missing required parameter: videoId'
      });
      return;
    }

    const comments = await getCommentsByVideoId(videoId);

    let result;
    if (type === 'top') {
      const topLevelComments = comments.filter(c => !c.parentCommentId);
      result = getTopComments(topLevelComments, parseInt(topLevelLimit as string));
    } else if (type === 'nested') {
      result = getCommentsWithReplies(comments, parseInt(topLevelLimit as string), parseInt(repliesLimit as string));
    } else {
      result = rankComments(comments);
    }

    res.json({
      success: true,
      data: result,
      count: result.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comments'
    });
  }
};

// POST /api/comments - Create a new comment
export const createComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { videoId, userId, content, parentCommentId } = req.body;

    if (!videoId || !userId || !content) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: videoId, userId, content'
      });
      return;
    }

    const newComment = await createCommentService({
      video_id: videoId,
      user_id: userId,
      content,
      parent_comment_id: parentCommentId,
      likes: 0,
      dislikes: 0,
      reply_count: 0
    });

    res.status(201).json({
      success: true,
      data: newComment
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: 'Failed to create comment'
    });
  }
};

// DELETE /api/comments/:id - Delete a comment
export const deleteComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Missing comment id'
      });
      return;
    }

    await deleteCommentService(id);

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete comment'
    });
  }
};

// GET /api/comments/:id/replies - Get replies for a comment
export const getReplies = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { limit } = req.query;
    const repliesLimit = parseInt(limit as string)
    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Missing comment id'
      });
      return;
    }

    const replies = await getRepliesService(id);
    const rankedReplies = rankComments(replies);
    const commentReplies = (repliesLimit && repliesLimit > 0) ? rankedReplies.slice(0, repliesLimit) : rankedReplies;

    res.json({
      success: true,
      data: commentReplies,
      count: commentReplies.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch replies'
    });
  }
};

export const increaseLike = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Missing comment id'
      });
      return;
    }

    await likeIncrement(id);

    res.json({
      success: true,
      message: 'Likes increased successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to increase likes'
    });
  }

};

export const decreaseLike = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Missing comment id'
      });
      return;
    }

    await likeDecrement(id);

    res.json({
      success: true,
      message: 'Likes decreased successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to decrease likes'
    });
  }

};

export const increaseDislike = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Missing comment id'
      });
      return;
    }

    await dislikeIncrement(id);

    res.json({
      success: true,
      message: 'Dislikes increased successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to increase dislikes'
    });
  }

};

export const decreaseDislike = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Missing comment id'
      });
      return;
    }

    await dislikeDecrement(id);

    res.json({
      success: true,
      message: 'Dislikes decreased successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to decrease dislikes'
    });
  }

};