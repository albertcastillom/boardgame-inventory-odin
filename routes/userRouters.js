const express = require('express');
const router = express.Router();
const controller = require('../controllers/userController');

router.get('/', controller.home);
router.get('/categories', controller.showCategories);
router.post('/newCategory', controller.createCategory);
router.put('/categories/:id', controller.updateCategory);
router.delete('/categories/:id', controller.destroyCategory);
router.get('/games', controller.showGames);
router.post('/newGame', controller.createGame);
router.put('/games/:id', controller.updateGame);
router.delete('/games/:id', controller.destroyGame);

module.exports = router;