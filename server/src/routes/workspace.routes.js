const { Router } = require('express');
const workspaceController = require('../controllers/workspace.controller');
const boardController = require('../controllers/board.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const wsValidator = require('../validators/workspace.validator');
const boardValidator = require('../validators/board.validator');

const router = Router();
router.use(authenticate);

router.post('/', validate(wsValidator.create), workspaceController.create);
router.get('/', workspaceController.list);
router.get('/:wsId', validate(wsValidator.getOne), workspaceController.getOne);
router.patch('/:wsId', validate(wsValidator.update), workspaceController.update);
router.delete('/:wsId', validate(wsValidator.remove), workspaceController.remove);

// Boards nested under workspaces
router.post('/:wsId/boards', validate(boardValidator.create), boardController.create);
router.get('/:wsId/boards', boardController.list);

module.exports = router;

