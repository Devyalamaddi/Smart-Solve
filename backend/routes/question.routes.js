

router.post('/questions', authenticate, questionController.createQuestion);
router.get('/questions', questionController.getQuestions);
router.get('/questions/:id', questionController.getQuestionById);
router.put('/questions/:id', authenticate, questionController.updateQuestion);
router.delete('/questions/:id', authenticate, questionController.deleteQuestion);
router.post('/questions/:id/vote', authenticate, questionController.voteQuestion);
router.post('/questions/:id/close', authenticate, questionController.closeQuestion);
router.post('/questions/:id/reopen', authenticate, questionController.reopenQuestion);
router.get('/questions/tag/:tag', questionController.getQuestionsByTag);
router.get('/questions/trending', questionController.getTrendingQuestions);

