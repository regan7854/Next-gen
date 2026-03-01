import { Router } from 'express';
import { validationResult } from 'express-validator';
import { loginRules, registerRules } from '../validators/authValidators.js';
import { registerUser, loginUser, getProfile } from '../controllers/authController.js';
import authenticate from '../middleware/authenticate.js';

const router = Router();

function validate(rules) {
  return [
    ...rules,
    (req, res, next) => {
      const result = validationResult(req);
      if (!result.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: result.array().map((issue) => ({
            field: issue.path,
            message: issue.msg,
          })),
        });
      }
      next();
    },
  ];
}

router.post('/register', validate(registerRules), registerUser);
router.post('/login', validate(loginRules), loginUser);
router.get('/me', authenticate, getProfile);

export default router;
