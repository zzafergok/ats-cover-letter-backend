import { Router } from 'express';
import { SalaryController } from '../controllers/salary.controller';

const router = Router();

router.post('/calculate', SalaryController.calculateSalary);

router.post('/gross-to-net', SalaryController.calculateGrossToNet);

router.post('/net-to-gross', SalaryController.calculateNetToGross);

router.get('/limits', SalaryController.getSalaryLimits);

router.get('/tax-configuration', SalaryController.getTaxConfiguration);

export default router;
