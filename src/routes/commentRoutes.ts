import { Router } from 'express';
import { getReplies,getComments,createComment,deleteComment, increaseLike, decreaseLike, increaseDislike, decreaseDislike } from '../controllers/commentsController';

const router = Router();

// Routes
router.get('/:videoId', getComments); // Get comments and replies for a video
router.post('/', createComment); // Create a new comment
router.put('/:id/increaseLike', increaseLike); // Increase like count for a comment
router.put('/:id/decreaseLike', decreaseLike); // Decrease like count for a comment
router.put('/:id/increasedislike', increaseDislike); // Increase dislike count for a comment    
router.put('/:id/decreasedislike', decreaseDislike); // Decrease dislike count for a comment
router.delete('/:id', deleteComment); // Delete a comment
router.get('/:id/replies', getReplies); // Get replies for a comment

export default router;