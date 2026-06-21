const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiError = require('../utils/ApiError');

const TEMP_DIR = path.join(__dirname, '../../uploads/temp');
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['.csv'];
const ALLOWED_MIMES = ['text/csv', 'application/vnd.ms-excel', 'application/octet-stream'];

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TEMP_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const fileExt = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
    return cb(
      new ApiError(400, `Unsupported file type. Only ${ALLOWED_EXTENSIONS.join(', ')} files are allowed.`)
    );
  }

  const isMimeValid = ALLOWED_MIMES.includes(file.mimetype);
  if (!isMimeValid && file.mimetype !== 'application/octet-stream') {
    if (fileExt !== '.csv') {
      return cb(new ApiError(400, 'Unsupported MIME type. File must be a valid CSV.'));
    }
  }

  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE
  }
});

module.exports = upload;
