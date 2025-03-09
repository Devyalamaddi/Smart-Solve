

router.post('/answers', authenticate, answerController.createAnswer);
router.get('/answers/:questionId', answerController.getAnswersByQuestion);
router.post('/answers/:id/vote', authenticate, answerController.voteAnswer);