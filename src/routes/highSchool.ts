import { Router } from 'express';
import HighSchoolController from '../controllers/highSchool.controller';

const router = Router();

// All endpoints are public (no auth required)
router.get('/', HighSchoolController.getAllHighSchools);
router.get('/search', HighSchoolController.searchHighSchools);
router.get('/city/:city', HighSchoolController.getHighSchoolsByCity);
router.get('/stats', HighSchoolController.getStats);
router.post('/reload', HighSchoolController.reloadData);
router.get('/:id', HighSchoolController.getHighSchoolById);

export default router;
