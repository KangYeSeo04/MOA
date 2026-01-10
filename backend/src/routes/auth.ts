import * as express from 'express';
import { signup } from '../controllers/auth.controller';

const router = express.Router();

// 회원가입 API 연결
router.post('/signup', signup);

export default router;
