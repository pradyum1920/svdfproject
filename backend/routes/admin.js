/**
 * routes/admin.js
 * All routes here require authenticate + authorise('admin').
 */

const router = require('express').Router();
const ctrl   = require('../controllers/adminController');
const { authenticate, authorise } = require('../middleware/auth');

router.use(authenticate, authorise('admin'));

router.get  ('/state'              , ctrl.getState);
router.post ('/reset'              , ctrl.reset);
router.get  ('/users'              , ctrl.listUsers);
router.patch('/users/:id'          , ctrl.updateUser);
router.delete('/users/:id'         , ctrl.deleteUser);
router.post ('/users/:id/promote'  , ctrl.promoteUser);
router.get  ('/stats'              , ctrl.stats);

module.exports = router;
