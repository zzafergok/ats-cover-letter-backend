import { Router } from 'express';
import UniversityController from '../controllers/university.controller';

const router = Router();

// All endpoints are public (no auth required)
router.get('/', UniversityController.getAllUniversities);
router.get('/search', UniversityController.searchUniversities);
router.get('/city/:city', UniversityController.getUniversitiesByCity);
router.get('/type/:type', UniversityController.getUniversitiesByType);
router.get('/stats', UniversityController.getStats);
router.post('/refresh', UniversityController.forceRefresh);
router.get('/:id', UniversityController.getUniversityById);

export default router;