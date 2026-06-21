const { Category, User, Product, sequelize } = require('../models');
const { Op } = require('sequelize');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../middlewares/asyncHandler');
const { hasHTMLOrScript, validateIdParam, validateCreateCategory, validateUpdateCategory } = require('../utils/validation');

const createCategory = asyncHandler(async (req, res, next) => {
  const { error, value } = validateCreateCategory(req.body);
  if (error) {
    throw new ApiError(400, 'Validation failed', error);
  }

  const { name, userId } = value;

  const user = await User.findByPk(userId);
  if (!user) {
    throw new ApiError(404, 'User not found. A valid user is required to perform this action.');
  }

  const existingCategory = await Category.findOne({
    where: { name: name.trim() }
  });

  if (existingCategory) {
    throw new ApiError(409, `Category name '${name}' already exists`);
  }

  const category = await Category.create({
    name: name.trim(),
    createdBy: user.id,
    updatedBy: user.id
  });

  return res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: category
  });
});

const getCategories = asyncHandler(async (req, res, next) => {
  const { search, page, limit } = req.query;

  const currentPage = Math.max(1, Math.floor(Number(page)) || 1);
  const currentLimit = Math.min(100, Math.max(1, Math.floor(Number(limit)) || 10));
  const offset = (currentPage - 1) * currentLimit;

  const whereClause = {};
  if (search) {
    const cleanSearch = String(search).trim();
    if (hasHTMLOrScript(cleanSearch)) {
      throw new ApiError(400, 'Search query contains invalid or malicious characters');
    }
    whereClause.name = {
      [Op.like]: `%${cleanSearch}%`
    };
  }

  const { count, rows } = await Category.findAndCountAll({
    where: whereClause,
    limit: currentLimit,
    offset,
    order: [['name', 'ASC']],
    include: [
      { model: User, as: 'creator', attributes: ['id', 'email'] },
      { model: User, as: 'updater', attributes: ['id', 'email'] }
    ]
  });

  const totalPages = Math.ceil(count / currentLimit);

  return res.status(200).json({
    success: true,
    message: 'Categories retrieved successfully',
    data: rows,
    pagination: {
      totalItems: count,
      totalPages,
      currentPage,
      limit: currentLimit
    }
  });
});

const getCategoryById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const parsedId = validateIdParam(id);
  if (!parsedId) {
    throw new ApiError(400, 'Invalid category ID format. ID must be a valid positive integer.');
  }

  const category = await Category.findByPk(parsedId, {
    include: [
      { model: User, as: 'creator', attributes: ['id', 'email'] },
      { model: User, as: 'updater', attributes: ['id', 'email'] }
    ]
  });

  if (!category) {
    throw new ApiError(404, `Category not found with ID: ${id}`);
  }

  return res.status(200).json({
    success: true,
    message: 'Category retrieved successfully',
    data: category
  });
});

const updateCategory = asyncHandler(async (req, res, next) => {
  const { error, value } = validateUpdateCategory(req.body);
  if (error) {
    throw new ApiError(400, 'Validation failed', error);
  }

  const { name, userId } = value;
  const { id } = req.params;
  const parsedId = validateIdParam(id);
  if (!parsedId) {
    throw new ApiError(400, 'Invalid category ID format. ID must be a valid positive integer.');
  }

  const category = await Category.findByPk(parsedId);
  if (!category) {
    throw new ApiError(404, `Category not found with ID: ${id}`);
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw new ApiError(404, 'User not found. A valid user is required to perform this action.');
  }

  const updateData = { updatedBy: user.id };

  if (name) {
    const trimmedName = name.trim();
    if (trimmedName.toLowerCase() !== category.name.toLowerCase()) {
      const duplicate = await Category.findOne({
        where: { name: trimmedName }
      });
      if (duplicate) {
        throw new ApiError(409, `Category name '${trimmedName}' already exists`);
      }
    }
    updateData.name = trimmedName;
  }

  await category.update(updateData);

  return res.status(200).json({
    success: true,
    message: 'Category updated successfully',
    data: category
  });
});

const deleteCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const parsedId = validateIdParam(id);
  if (!parsedId) {
    throw new ApiError(400, 'Invalid category ID format. ID must be a valid positive integer.');
  }

  const category = await Category.findByPk(parsedId);
  if (!category) {
    throw new ApiError(404, `Category not found with ID: ${id}`);
  }

  const productsCount = await Product.count({ where: { categoryId: category.id } });
  if (productsCount > 0) {
    throw new ApiError(
      400,
      `Cannot delete category. There are ${productsCount} product(s) linked to this category.`
    );
  }

  await category.destroy();

  return res.status(200).json({
    success: true,
    message: 'Category deleted successfully'
  });
});

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
};
