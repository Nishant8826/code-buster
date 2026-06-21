const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const categoryNameRegex = /^[a-zA-Z][a-zA-Z0-9\s\-\&]*$/;

const hasHTMLOrScript = (value) => {
  if (typeof value !== 'string') return false;
  const htmlTagRegex = /<\/?[a-zA-Z!/][^>]*>?/;
  const scriptRegex = /javascript:/i;
  const onloadRegex = /onload\s*=/i;
  const onerrorRegex = /onerror\s*=/i;
  return htmlTagRegex.test(value) || scriptRegex.test(value) || onloadRegex.test(value) || onerrorRegex.test(value);
};

const validateIdParam = (id) => {
  const parsedId = Number(id);
  if (isNaN(parsedId) || parsedId <= 0 || !Number.isInteger(parsedId) || String(parsedId) !== String(id).trim()) {
    return null;
  }
  return parsedId;
};

const validateCreateUser = (data) => {
  const errors = [];
  const value = {};

  if (data.email === undefined || data.email === null) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else {
    const email = String(data.email).trim();
    if (email.length === 0) {
      errors.push({ field: 'email', message: 'Email cannot be blank' });
    } else if (hasHTMLOrScript(email)) {
      errors.push({ field: 'email', message: 'Email contains invalid or malicious characters' });
    } else if (!emailRegex.test(email)) {
      errors.push({ field: 'email', message: 'Email must be a valid format' });
    } else {
      value.email = email;
    }
  }

  if (data.password === undefined || data.password === null) {
    errors.push({ field: 'password', message: 'Password is required' });
  } else {
    const password = String(data.password);
    if (password.length === 0) {
      errors.push({ field: 'password', message: 'Password cannot be blank' });
    } else if (hasHTMLOrScript(password)) {
      errors.push({ field: 'password', message: 'Password contains invalid or malicious characters' });
    } else if (password.length < 6) {
      errors.push({ field: 'password', message: 'Password must be at least 6 characters long' });
    } else {
      value.password = password;
    }
  }

  return {
    error: errors.length ? errors : null,
    value
  };
};

const validateCreateCategory = (data) => {
  const errors = [];
  const value = {};

  if (data.name === undefined || data.name === null) {
    errors.push({ field: 'name', message: 'Category name is required' });
  } else {
    const name = String(data.name).trim();
    if (name.length === 0) {
      errors.push({ field: 'name', message: 'Category name cannot be blank' });
    } else if (name.length > 50) {
      errors.push({ field: 'name', message: 'Category name must not exceed 50 characters' });
    } else if (!categoryNameRegex.test(name)) {
      errors.push({ field: 'name', message: 'Category name must start with a letter and contain only letters, numbers, spaces, hyphens, or ampersands' });
    } else {
      value.name = name;
    }
  }

  if (data.userId === undefined || data.userId === null) {
    errors.push({ field: 'userId', message: 'userId is required to identify the creator' });
  } else {
    const userId = Number(data.userId);
    if (isNaN(userId) || userId <= 0 || !Number.isInteger(userId)) {
      errors.push({ field: 'userId', message: 'userId must be a valid positive integer' });
    } else {
      value.userId = userId;
    }
  }

  return {
    error: errors.length ? errors : null,
    value
  };
};

const validateUpdateCategory = (data) => {
  const errors = [];
  const value = {};

  if (data.name !== undefined && data.name !== null) {
    const name = String(data.name).trim();
    if (name.length === 0) {
      errors.push({ field: 'name', message: 'Category name cannot be blank' });
    } else if (name.length > 50) {
      errors.push({ field: 'name', message: 'Category name must not exceed 50 characters' });
    } else if (!categoryNameRegex.test(name)) {
      errors.push({ field: 'name', message: 'Category name must start with a letter and contain only letters, numbers, spaces, hyphens, or ampersands' });
    } else {
      value.name = name;
    }
  }

  if (data.userId === undefined || data.userId === null) {
    errors.push({ field: 'userId', message: 'userId is required to identify the updater' });
  } else {
    const userId = Number(data.userId);
    if (isNaN(userId) || userId <= 0 || !Number.isInteger(userId)) {
      errors.push({ field: 'userId', message: 'userId must be a valid positive integer' });
    } else {
      value.userId = userId;
    }
  }

  return {
    error: errors.length ? errors : null,
    value
  };
};

const validateCreateProduct = (data) => {
  const errors = [];
  const value = {};

  if (data.name === undefined || data.name === null) {
    errors.push({ field: 'name', message: 'Product name is required' });
  } else {
    const name = String(data.name).trim();
    const productNameRegex = /^[a-zA-Z][a-zA-Z0-9\s\-\&]*$/;
    if (name.length === 0) {
      errors.push({ field: 'name', message: 'Product name cannot be blank' });
    } else if (name.length > 100) {
      errors.push({ field: 'name', message: 'Product name must not exceed 100 characters' });
    } else if (hasHTMLOrScript(name)) {
      errors.push({ field: 'name', message: 'Product name contains invalid or malicious characters' });
    } else if (!productNameRegex.test(name)) {
      errors.push({ field: 'name', message: 'Product name must start with a letter and contain only letters, numbers, spaces, hyphens, or ampersands' });
    } else {
      value.name = name;
    }
  }

  if (data.productImage !== undefined && data.productImage !== null) {
    const img = String(data.productImage).trim();
    if (hasHTMLOrScript(img)) {
      errors.push({ field: 'productImage', message: 'Product image URL contains invalid or malicious characters' });
    } else {
      value.productImage = img;
    }
  } else {
    value.productImage = null;
  }

  if (data.productPrice === undefined || data.productPrice === null) {
    errors.push({ field: 'productPrice', message: 'Product price is required' });
  } else {
    const price = parseFloat(data.productPrice);
    if (isNaN(price) || price <= 0) {
      errors.push({ field: 'productPrice', message: 'Product price must be a valid positive number' });
    } else {
      value.productPrice = price;
    }
  }

  if (data.categoryId === undefined || data.categoryId === null) {
    errors.push({ field: 'categoryId', message: 'categoryId is required' });
  } else {
    const categoryId = Number(data.categoryId);
    if (isNaN(categoryId) || categoryId <= 0 || !Number.isInteger(categoryId)) {
      errors.push({ field: 'categoryId', message: 'categoryId must be a valid positive integer' });
    } else {
      value.categoryId = categoryId;
    }
  }

  if (data.userId === undefined || data.userId === null) {
    errors.push({ field: 'userId', message: 'userId is required to identify the creator' });
  } else {
    const userId = Number(data.userId);
    if (isNaN(userId) || userId <= 0 || !Number.isInteger(userId)) {
      errors.push({ field: 'userId', message: 'userId must be a valid positive integer' });
    } else {
      value.userId = userId;
    }
  }

  return {
    error: errors.length ? errors : null,
    value
  };
};

const validateUpdateProduct = (data) => {
  const errors = [];
  const value = {};

  if (data.name !== undefined && data.name !== null) {
    const name = String(data.name).trim();
    const productNameRegex = /^[a-zA-Z][a-zA-Z0-9\s\-\&]*$/;
    if (name.length === 0) {
      errors.push({ field: 'name', message: 'Product name cannot be blank' });
    } else if (name.length > 100) {
      errors.push({ field: 'name', message: 'Product name must not exceed 100 characters' });
    } else if (hasHTMLOrScript(name)) {
      errors.push({ field: 'name', message: 'Product name contains invalid or malicious characters' });
    } else if (!productNameRegex.test(name)) {
      errors.push({ field: 'name', message: 'Product name must start with a letter and contain only letters, numbers, spaces, hyphens, or ampersands' });
    } else {
      value.name = name;
    }
  }

  if (data.productImage !== undefined && data.productImage !== null) {
    const img = String(data.productImage).trim();
    if (hasHTMLOrScript(img)) {
      errors.push({ field: 'productImage', message: 'Product image URL contains invalid or malicious characters' });
    } else {
      value.productImage = img;
    }
  }

  if (data.productPrice !== undefined && data.productPrice !== null) {
    const price = parseFloat(data.productPrice);
    if (isNaN(price) || price <= 0) {
      errors.push({ field: 'productPrice', message: 'Product price must be a valid positive number' });
    } else {
      value.productPrice = price;
    }
  }

  if (data.categoryId !== undefined && data.categoryId !== null) {
    const categoryId = Number(data.categoryId);
    if (isNaN(categoryId) || categoryId <= 0 || !Number.isInteger(categoryId)) {
      errors.push({ field: 'categoryId', message: 'categoryId must be a valid positive integer' });
    } else {
      value.categoryId = categoryId;
    }
  }

  if (data.userId === undefined || data.userId === null) {
    errors.push({ field: 'userId', message: 'userId is required to identify the updater' });
  } else {
    const userId = Number(data.userId);
    if (isNaN(userId) || userId <= 0 || !Number.isInteger(userId)) {
      errors.push({ field: 'userId', message: 'userId must be a valid positive integer' });
    } else {
      value.userId = userId;
    }
  }

  return {
    error: errors.length ? errors : null,
    value
  };
};

const validateProductListQuery = (data) => {
  const errors = [];
  const value = {};

  value.page = data.page;
  value.limit = data.limit;

  if (data.search !== undefined && data.search !== null) {
    const searchVal = String(data.search).trim();
    if (hasHTMLOrScript(searchVal)) {
      errors.push({ field: 'search', message: 'search query contains invalid or malicious characters' });
    } else {
      value.search = searchVal;
    }
  }

  if (data.category !== undefined && data.category !== null) {
    const category = Number(data.category);
    if (isNaN(category) || category <= 0 || !Number.isInteger(category)) {
      errors.push({ field: 'category', message: 'category query must be a valid positive integer category ID' });
    } else {
      value.category = category;
    }
  }

  if (data.sortBy !== undefined && data.sortBy !== null) {
    const sortBy = String(data.sortBy).trim();
    const allowedFields = ['productPrice', 'name', 'createdAt'];
    if (!allowedFields.includes(sortBy)) {
      errors.push({ field: 'sortBy', message: `sortBy must be one of: ${allowedFields.join(', ')}` });
    } else {
      value.sortBy = sortBy;
    }
  }

  if (data.sortOrder !== undefined && data.sortOrder !== null) {
    const sortOrder = String(data.sortOrder).trim().toLowerCase();
    if (sortOrder !== 'asc' && sortOrder !== 'desc') {
      errors.push({ field: 'sortOrder', message: 'sortOrder must be either asc or desc' });
    } else {
      value.sortOrder = sortOrder;
    }
  }

  return {
    error: errors.length ? errors : null,
    value
  };
};

module.exports = {
  hasHTMLOrScript,
  validateIdParam,
  validateCreateUser,
  validateCreateCategory,
  validateUpdateCategory,
  validateCreateProduct,
  validateUpdateProduct,
  validateProductListQuery
};
