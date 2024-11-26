import express from 'express';
import { getCouples, generateTask } from '../controllers/couple';

const router = express.Router();

router.get('/couple', getCouples);
router.post('/couple/:id/task', async (req, res) => {
  await generateTask(req, res);
});

export default router; 