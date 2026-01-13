import { body, ValidationChain } from 'express-validator';

// User validation
export const validateUserRegistration: ValidationChain[] = [
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2 })
    .withMessage('Full name must be at least 2 characters long'),
  body('role')
    .isIn(['admin', 'manager', 'staff'])
    .withMessage('Invalid user role'),
  body('stationId')
    .notEmpty()
    .withMessage('Station is required')
    .isMongoId()
    .withMessage('Invalid station ID'),
];

export const validateLogin: ValidationChain[] = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username or email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// Station validation
export const validateStation: ValidationChain[] = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Station name is required')
    .isLength({ min: 3 })
    .withMessage('Station name must be at least 3 characters long'),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Station address is required'),
  body('contactNumber')
    .trim()
    .notEmpty()
    .withMessage('Contact number is required')
    .matches(/^[0-9]{10}$/)
    .withMessage('Please provide a valid 10-digit contact number'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
];

// Vehicle validation
export const validateVehicle: ValidationChain[] = [
  body('vehicleType')
    .isIn(['bike', 'car', 'truck', 'other'])
    .withMessage('Invalid vehicle type'),
  body('companyBrand')
    .trim()
    .notEmpty()
    .withMessage('Company/Brand is required'),
  body('registrationNumber')
    .trim()
    .notEmpty()
    .withMessage('Registration number is required')
    .matches(/^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{1,4}$/)
    .withMessage('Please provide a valid registration number (e.g., MH12AB1234)'),
  body('engineNumber')
    .trim()
    .notEmpty()
    .withMessage('Engine number is required'),
  body('chassisNumber')
    .trim()
    .notEmpty()
    .withMessage('Chassis number is required'),
  body('owner.name')
    .trim()
    .notEmpty()
    .withMessage('Owner name is required'),
  body('owner.address')
    .trim()
    .notEmpty()
    .withMessage('Owner address is required'),
  body('owner.mobile')
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage('Please provide a valid 10-digit mobile number'),
  body('owner.idProofType')
    .isIn(['Aadhar Card', 'PAN Card', 'Driving License', 'Passport', 'Voter ID', 'Other'])
    .withMessage('Invalid ID proof type'),
  body('owner.idProofNumber')
    .trim()
    .notEmpty()
    .withMessage('Owner ID proof number is required'),
];

export default {
  validateUserRegistration,
  validateLogin,
  validateStation,
  validateVehicle,
};
