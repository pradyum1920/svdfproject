/**
 * routes/alerts.js
 */

const router = require('express').Router();
const ctrl   = require('../controllers/alertsController');
const { authenticate, authorise } = require('../middleware/auth');

router.use(authenticate);

router.get ('/'             , ctrl.list);
router.get ('/:id'          , ctrl.getOne);
router.post('/ack-all'      , ctrl.acknowledgeAll);
router.post('/:id/ack'      , ctrl.acknowledge);
router.delete('/'           , authorise('admin'), ctrl.clearAll);
router.post('/test'         , authorise('admin'), ctrl.testAlert);

module.exports = router;
