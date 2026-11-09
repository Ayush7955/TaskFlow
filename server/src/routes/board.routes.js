const { Router } = require('express');
const boardController = require('../controllers/board.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const boardValidator = require('../validators/board.validator');

const router = Router();
router.use(authenticate);

router.get('/:boardId', boardController.getOne);
router.patch('/:boardId', validate(boardValidator.update), boardController.update);
router.post('/:boardId/archive', boardController.archive);
router.post('/:boardId/restore', boardController.restore);
router.delete('/:boardId', boardController.remove);

module.exports = router;

