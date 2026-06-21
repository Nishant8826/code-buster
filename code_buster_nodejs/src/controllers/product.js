const fs = require('fs');
const { Op } = require('sequelize');
const { parse } = require('csv-parse');
const XLSX = require('xlsx');
const { Product, Category, User, sequelize } = require('../models');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');
const asyncHandler = require('../middlewares/asyncHandler');
const {
  hasHTMLOrScript,
  validateIdParam,
  validateCreateProduct,
  validateUpdateProduct,
  validateProductListQuery
} = require('../utils/validation');

const DEFAULT_PAGE = 1;
const BATCH_SIZE = parseInt(process.env.BULK_UPLOAD_BATCH_SIZE, 10) || 500;
const REQUIRED_COLUMNS = ['name', 'productImage', 'productPrice', 'categoryId', 'userId'];

const deleteTempFile = async (filePath) => {
  if (!filePath) return;
  try {
    await fs.promises.unlink(filePath);
    logger.debug(`Successfully removed temp file: ${filePath}`);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      logger.error(`Error deleting temp file at ${filePath}: ${error.message}`);
    }
  }
};

const getPaginationParams = (query) => {
  const page = Math.max(1, Math.floor(Number(query.page)) || 1);
  const limit = Math.min(100, Math.max(1, Math.floor(Number(query.limit)) || 10));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const getPaginationMetadata = (count, page, limit) => {
  return {
    totalItems: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    limit
  };
};

const streamCsvExport = async (res, queryOptions) => {
  try {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=products-report-${Date.now()}.csv`);
    
    res.write('\uFEFF');
    res.write('"Category Name","Product Name","Product Price","Product Unique ID"\r\n');

    let offset = 0;
    const limit = 1000;
    let hasMore = true;

    while (hasMore) {
      const products = await Product.findAll({
        ...queryOptions,
        limit,
        offset,
        raw: true,
        nest: true
      });

      if (products.length === 0) {
        hasMore = false;
        break;
      }

      for (const prod of products) {
        const categoryName = prod.category ? prod.category.name : '';
        const productName = prod.name || '';
        const productPrice = prod.productPrice || '0.00';
        const productId = prod.id || '';

        const escapedCategory = categoryName.replace(/"/g, '""');
        const escapedProduct = productName.replace(/"/g, '""');

        res.write(`"${escapedCategory}","${escapedProduct}",${productPrice},"${productId}"\r\n`);
      }

      logger.debug(`CSV Export: Streamed ${products.length} products (offset ${offset})`);

      if (products.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }

    res.end();
  } catch (error) {
    logger.error('Error during CSV streaming export:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate CSV export due to a stream error'
      });
    } else {
      res.end();
    }
  }
};

const generateXlsxExport = async (res, queryOptions) => {
  try {
    const reportData = [];
    let offset = 0;
    const limit = 1000;
    let hasMore = true;

    while (hasMore) {
      const products = await Product.findAll({
        ...queryOptions,
        limit,
        offset,
        raw: true,
        nest: true
      });

      if (products.length === 0) {
        hasMore = false;
        break;
      }

      for (const prod of products) {
        reportData.push({
          'Category Name': prod.category ? prod.category.name : '',
          'Product Name': prod.name || '',
          'Product Price': prod.productPrice ? parseFloat(prod.productPrice) : 0.00,
          'Product Unique ID': prod.id || ''
        });
      }

      logger.debug(`XLSX Export: Loaded ${products.length} products to memory array (offset ${offset})`);

      if (products.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }

    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=products-report-${Date.now()}.xlsx`
    );

    res.send(buffer);
  } catch (error) {
    logger.error('Error during XLSX report generation:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate XLSX report'
      });
    }
  }
};

const processBulkUpload = async (filePath) => {
  const categories = await Category.findAll({ attributes: ['id'], raw: true });
  const categorySet = new Set(categories.map((c) => c.id));

  const users = await User.findAll({ attributes: ['id'], raw: true });
  const userSet = new Set(users.map((u) => u.id));

  return new Promise((resolve, reject) => {
    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true
    });

    const recordsToInsert = [];
    const failures = [];
    const seenProducts = new Set();

    let totalRows = 0;
    let fileLine = 1;

    parser.on('data', (row) => {
      totalRows++;
      fileLine++;

      if (totalRows === 1) {
        const headers = Object.keys(row);
        const missing = REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
        if (missing.length > 0) {
          parser.destroy(
            new Error(`CSV upload failed validation. Missing required headers: ${missing.join(', ')}`)
          );
          return;
        }
      }

      const { name, productImage, productPrice, categoryId, userId } = row;
      const rowErrors = [];

      if (!name) {
        rowErrors.push('Product name is required');
      } else {
        const trimmedName = name.trim();
        const productNameRegex = /^[a-zA-Z][a-zA-Z0-9\s\-\&]*$/;
        if (trimmedName.length === 0) {
          rowErrors.push('Product name cannot be blank');
        } else if (trimmedName.length > 100) {
          rowErrors.push('Product name must not exceed 100 characters');
        } else if (hasHTMLOrScript(trimmedName)) {
          rowErrors.push('Product name contains invalid or malicious characters');
        } else if (!productNameRegex.test(trimmedName)) {
          rowErrors.push('Product name must start with a letter and contain only letters, numbers, spaces, hyphens, or ampersands');
        }
      }

      if (productImage) {
        const trimmedImg = productImage.trim();
        if (hasHTMLOrScript(trimmedImg)) {
          rowErrors.push('Product image contains invalid or malicious characters');
        }
      }

      const price = parseFloat(productPrice);
      if (isNaN(price) || price <= 0) {
        rowErrors.push('Product price must be a valid positive number');
      }

      const parsedCategoryId = Number(categoryId);
      if (isNaN(parsedCategoryId) || parsedCategoryId <= 0 || !Number.isInteger(parsedCategoryId)) {
        rowErrors.push('categoryId must be a valid positive integer');
      } else if (!categorySet.has(parsedCategoryId)) {
        rowErrors.push(`Category ID '${parsedCategoryId}' does not exist`);
      }

      const parsedUserId = Number(userId);
      if (isNaN(parsedUserId) || parsedUserId <= 0 || !Number.isInteger(parsedUserId)) {
        rowErrors.push('userId must be a valid positive integer');
      } else if (!userSet.has(parsedUserId)) {
        rowErrors.push(`User ID '${parsedUserId}' does not exist`);
      }

      if (name && !isNaN(parsedCategoryId) && parsedCategoryId > 0) {
        const uniqueKey = `${name.trim().toLowerCase()}||${parsedCategoryId}`;
        if (seenProducts.has(uniqueKey)) {
          rowErrors.push(`Duplicate product '${name.trim()}' for category ID '${parsedCategoryId}' listed in the same upload file`);
        } else {
          seenProducts.add(uniqueKey);
        }
      }

      if (rowErrors.length > 0) {
        failures.push({
          row: fileLine,
          errors: rowErrors
        });
      } else {
        recordsToInsert.push({
          name: name.trim(),
          productImage: productImage ? productImage.trim() : null,
          productPrice: price,
          categoryId: parsedCategoryId,
          createdBy: parsedUserId,
          updatedBy: parsedUserId
        });
      }
    });

    parser.on('end', async () => {
      if (recordsToInsert.length === 0) {
        return resolve({
          totalRows,
          successCount: 0,
          failedCount: failures.length,
          insertedCount: 0,
          failures
        });
      }

      const transaction = await sequelize.transaction();
      try {
        const batchSize = BATCH_SIZE;
        logger.info(`Bulk Product Import: Preparing transaction to insert ${recordsToInsert.length} products in chunks of ${batchSize}`);

        for (let i = 0; i < recordsToInsert.length; i += batchSize) {
          const chunk = recordsToInsert.slice(i, i + batchSize);
          await Product.bulkCreate(chunk, { transaction });
        }

        await transaction.commit();
        logger.info(`Bulk Product Import: Successfully committed transactions for ${recordsToInsert.length} products`);

        resolve({
          totalRows,
          successCount: recordsToInsert.length,
          failedCount: failures.length,
          insertedCount: recordsToInsert.length,
          failures
        });
      } catch (dbError) {
        await transaction.rollback();
        logger.error('Bulk Product Import transaction failed, rolled back.', dbError);
        reject(dbError);
      }
    });

    parser.on('error', (parseError) => {
      reject(parseError);
    });

    fs.createReadStream(filePath).pipe(parser);
  });
};

const createProduct = asyncHandler(async (req, res, next) => {
  const { error, value } = validateCreateProduct(req.body);
  if (error) {
    throw new ApiError(400, 'Validation failed', error);
  }

  const { name, productImage, productPrice, categoryId, userId } = value;

  const user = await User.findByPk(userId);
  if (!user) {
    throw new ApiError(404, 'User not found. A valid user is required.');
  }

  const category = await Category.findByPk(categoryId);
  if (!category) {
    throw new ApiError(404, 'Category not found. Product must belong to an existing category.');
  }

  const product = await Product.create({
    name,
    productImage,
    productPrice,
    categoryId,
    createdBy: user.id,
    updatedBy: user.id
  });

  const createdProduct = await Product.findByPk(product.id, {
    include: [
      { model: Category, as: 'category', attributes: ['id', 'name'] }
    ]
  });

  return res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: createdProduct
  });
});

const getProducts = asyncHandler(async (req, res, next) => {
  const { error, value } = validateProductListQuery(req.query);
  if (error) {
    throw new ApiError(400, 'Validation failed', error);
  }

  const { page, limit, search, category, sortBy, sortOrder } = value;
  const { limit: paginationLimit, offset } = getPaginationParams({ page, limit });

  const whereProduct = {};
  if (category) {
    whereProduct.categoryId = category;
  }
  if (search) {
    const searchTerm = `%${search.trim()}%`;
    whereProduct[Op.or] = [
      sequelize.where(sequelize.col('Product.name'), 'LIKE', searchTerm),
      sequelize.where(sequelize.col('category.name'), 'LIKE', searchTerm)
    ];
  }

  let orderClause = [['createdAt', 'DESC']];
  if (sortBy) {
    const orderDirection = (sortOrder && sortOrder.toLowerCase() === 'asc') ? 'ASC' : 'DESC';
    orderClause = [[sortBy, orderDirection]];
  }

  const { count, rows } = await Product.findAndCountAll({
    where: whereProduct,
    limit: paginationLimit,
    offset,
    order: orderClause,
    subQuery: false,
    include: [
      {
        model: Category,
        as: 'category',
        required: true,
        attributes: ['id', 'name']
      },
      { model: User, as: 'creator', attributes: ['id', 'email'] },
      { model: User, as: 'updater', attributes: ['id', 'email'] }
    ]
  });

  const pagination = getPaginationMetadata(count, page || DEFAULT_PAGE, paginationLimit);

  return res.status(200).json({
    success: true,
    message: 'Products retrieved successfully',
    data: rows,
    pagination
  });
});

const getProductById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const parsedId = validateIdParam(id);
  if (!parsedId) {
    throw new ApiError(400, 'Invalid product ID format. ID must be a valid positive integer.');
  }

  const product = await Product.findByPk(parsedId, {
    include: [
      { model: Category, as: 'category', attributes: ['id', 'name'] },
      { model: User, as: 'creator', attributes: ['id', 'email'] },
      { model: User, as: 'updater', attributes: ['id', 'email'] }
    ]
  });

  if (!product) {
    throw new ApiError(404, `Product not found with ID: ${id}`);
  }

  return res.status(200).json({
    success: true,
    message: 'Product retrieved successfully',
    data: product
  });
});

const updateProduct = asyncHandler(async (req, res, next) => {
  const { error, value } = validateUpdateProduct(req.body);
  if (error) {
    throw new ApiError(400, 'Validation failed', error);
  }

  const { name, productImage, productPrice, categoryId, userId } = value;
  const { id } = req.params;
  const parsedId = validateIdParam(id);
  if (!parsedId) {
    throw new ApiError(400, 'Invalid product ID format. ID must be a valid positive integer.');
  }

  const product = await Product.findByPk(parsedId);
  if (!product) {
    throw new ApiError(404, `Product not found with ID: ${id}`);
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw new ApiError(404, 'User not found. A valid user is required.');
  }

  const updateData = { updatedBy: user.id };

  if (name !== undefined) updateData.name = name.trim();
  if (productImage !== undefined) updateData.productImage = productImage ? productImage.trim() : null;
  if (productPrice !== undefined) updateData.productPrice = parseFloat(productPrice);

  if (categoryId) {
    const category = await Category.findByPk(categoryId);
    if (!category) {
      throw new ApiError(404, 'Category not found. Cannot assign product to non-existent category.');
    }
    updateData.categoryId = category.id;
  }

  await product.update(updateData);

  const updatedProduct = await Product.findByPk(product.id, {
    include: [
      { model: Category, as: 'category', attributes: ['id', 'name'] },
      { model: User, as: 'creator', attributes: ['id', 'email'] },
      { model: User, as: 'updater', attributes: ['id', 'email'] }
    ]
  });

  return res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: updatedProduct
  });
});

const deleteProduct = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const parsedId = validateIdParam(id);
  if (!parsedId) {
    throw new ApiError(400, 'Invalid product ID format. ID must be a valid positive integer.');
  }

  const product = await Product.findByPk(parsedId);
  if (!product) {
    throw new ApiError(404, `Product not found with ID: ${id}`);
  }

  await product.destroy();

  return res.status(200).json({
    success: true,
    message: 'Product deleted successfully'
  });
});

const bulkUploadProducts = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    throw new ApiError(400, 'CSV file upload is required');
  }

  const filePath = req.file.path;

  try {
    const summary = await processBulkUpload(filePath);
    return res.status(200).json({
      success: true,
      message: 'Bulk upload completed',
      data: summary
    });
  } finally {
    await deleteTempFile(filePath);
  }
});

const exportProductsReport = asyncHandler(async (req, res, next) => {
  const { format, search, category } = req.query;
  const exportFormat = format ? format.toLowerCase() : 'csv';

  if (exportFormat !== 'csv' && exportFormat !== 'xlsx') {
    throw new ApiError(400, 'Invalid export format. Allowed formats: csv, xlsx');
  }

  const whereProduct = {};
  if (category) {
    const parsedCategoryId = Number(category);
    if (isNaN(parsedCategoryId) || parsedCategoryId <= 0 || !Number.isInteger(parsedCategoryId)) {
      throw new ApiError(400, 'category query must be a valid positive integer category ID');
    }
    whereProduct.categoryId = parsedCategoryId;
  }
  if (search) {
    const cleanSearch = String(search).trim();
    if (hasHTMLOrScript(cleanSearch)) {
      throw new ApiError(400, 'Search query contains invalid or malicious characters');
    }
    const searchTerm = `%${cleanSearch}%`;
    whereProduct[Op.or] = [
      sequelize.where(sequelize.col('Product.name'), 'LIKE', searchTerm),
      sequelize.where(sequelize.col('category.name'), 'LIKE', searchTerm)
    ];
  }

  const queryOptions = {
    where: whereProduct,
    subQuery: false,
    include: [
      {
        model: Category,
        as: 'category',
        required: true,
        attributes: ['name']
      }
    ],
    order: [['name', 'ASC']]
  };

  if (exportFormat === 'csv') {
    await streamCsvExport(res, queryOptions);
  } else {
    await generateXlsxExport(res, queryOptions);
  }
});

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  bulkUploadProducts,
  exportProductsReport
};
