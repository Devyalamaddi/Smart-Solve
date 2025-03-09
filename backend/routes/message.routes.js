router.post('/messages', authenticate, messageController.sendMessage);
router.get('/messages/:withUser', authenticate, messageController.getMessages);
router.put('/messages/:messageId/read', authenticate, messageController.markAsRead);
router.delete('/messages/:messageId', authenticate, messageController.deleteMessage);