const express = require('express');
const router = express.Router();

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  bulkUploadProducts,
  exportProductsReport
} = require('../controllers/product');

const upload = require('../middlewares/upload');

router.get('/export', exportProductsReport);
router.post('/bulk-upload', upload.single('file'), bulkUploadProducts);

router.post('/', createProduct);
router.get('/', getProducts);
router.get('/:id', getProductById);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
