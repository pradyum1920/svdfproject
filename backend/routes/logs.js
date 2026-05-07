/**
 * routes/logs.js
 */

const router = require('express').Router();
const { body } = require('express-validator');
const ctrl   = require('../controllers/logsController');
const { authenticate, authorise } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(authenticate);

router.get ('/'         , ctrl.list);
router.get ('/download' , ctrl.download);
router.delete('/'       , authorise('admin'), ctrl.clearAll);
router.post ('/',
  [body('message').notEmpty().withMessage('message is required')],
  validate,
  ctrl.create,
);

module.exports = router;
