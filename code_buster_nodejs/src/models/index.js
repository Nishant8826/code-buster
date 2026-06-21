const sequelize = require('../config/db');
const { createUserModel } = require('./user');
const { createCategoryModel } = require('./category');
const { createProductModel } = require('./product');

const User = createUserModel(sequelize);
const Category = createCategoryModel(sequelize);
const Product = createProductModel(sequelize);

Category.hasMany(Product, { foreignKey: 'categoryId', onDelete: 'RESTRICT' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

User.hasMany(Category, { foreignKey: 'createdBy', as: 'createdCategories' });
User.hasMany(Category, { foreignKey: 'updatedBy', as: 'updatedCategories' });
Category.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Category.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

User.hasMany(Product, { foreignKey: 'createdBy', as: 'createdProducts' });
User.hasMany(Product, { foreignKey: 'updatedBy', as: 'updatedProducts' });
Product.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Product.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

module.exports = {
  sequelize,
  User,
  Category,
  Product
};
