import { Router } from 'express';
import LocationController from '../controllers/location.controller';

const router = Router();

// Province endpoints
router.get('/provinces', LocationController.getAllProvinces);
router.get('/provinces/search', LocationController.searchProvinces);
router.get('/provinces/code/:code', LocationController.getProvinceByCode);
router.get('/provinces/name/:name', LocationController.getProvinceByName);

// District endpoints
router.get('/districts/search', LocationController.searchDistricts);
router.get(
  '/districts/province-code/:code',
  LocationController.getDistrictsByProvinceCode
);
router.get(
  '/districts/province-name/:name',
  LocationController.getDistrictsByProvinceName
);

// Stats endpoint
router.get('/stats', LocationController.getStats);

export default router;
