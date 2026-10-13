const express   = require('express');
const rateLimit = require('express-rate-limit');
const { verifyToken } = require('../middleware/authMiddleware');
const {
  registerCompany, registerEmployee, login, getMe,
  registerCompanyValidation, registerEmployeeValidation, loginValidation
} = require('../controllers/authController');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  message:  { success: false, message: 'Too many attempts. Try again in 15 minutes.' }
});

router.post('/register-company',  registerCompanyValidation,  registerCompany);
router.post('/register-employee', registerEmployeeValidation, registerEmployee);
router.post('/login',             loginLimiter, loginValidation, login);
router.get('/me',                 verifyToken,  getMe);

module.exports = router;