const express = require('express');
const router = express.Router();
const { authRequired: auth } = require('../middleware/auth');
const ctrl = require('../controllers/favorite.controller');

router.use(auth);

router.post('/', ctrl.addFavorite);
router.get('/', ctrl.getFavorites);
router.delete('/:favType/:favId', ctrl.removeFavorite);

module.exports = router;
