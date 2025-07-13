import { Router } from 'express';
import { getReplies,getComments,createComment,deleteComment, increaseLike, decreaseLike, increaseDislike, decreaseDislike } from '../controllers/commentsController';

const router = Router();

// Routes
router.get('/:videoId', getComments); // Get comments and replies for a video
// http://localhost:4000/api/comments/video_123?type=nested&topLevelLimit=1&repliesLimit=3

router.post('/', createComment); // Create a new comment
//http://localhost:4000/api/comments/

router.put('/:id/increaseLike', increaseLike); // Increase like count for a comment
//http://localhost:4000/api/comments/11111111-1111-1111-1111-111111111111/increaseLike

router.put('/:id/decreaseLike', decreaseLike); // Decrease like count for a comment
router.put('/:id/increasedislike', increaseDislike); // Increase dislike count for a comment    
router.put('/:id/decreasedislike', decreaseDislike); // Decrease dislike count for a comment

router.delete('/:id', deleteComment); // Delete a comment
//http://localhost:4000/api/comments/7d2fc626-02ef-4b1b-851e-24677f490763

router.get('/:id/replies', getReplies); // Get replies for a comment

export default router;