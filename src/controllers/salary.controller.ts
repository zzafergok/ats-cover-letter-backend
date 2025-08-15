import { Request, Response } from 'express';
import {
  SalaryCalculationRequest,
  GrossToNetRequest,
  NetToGrossRequest,
  ApiResponse,
} from '../types';
import { SalaryCalculationService } from '../services/salaryCalculation.service';
import logger from '../config/logger';

export class SalaryController {
  static async calculateSalary(req: Request, res: Response): Promise<void> {
    try {
      const requestData: SalaryCalculationRequest = req.body;

      const result = SalaryCalculationService.calculateSalary(requestData);

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Salary calculation completed successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error in salary calculation:', error);

      const response: ApiResponse = {
        success: false,
        error:
          error instanceof Error ? error.message : 'Salary calculation failed',
      };

      res.status(400).json(response);
    }
  }

  static async calculateGrossToNet(req: Request, res: Response): Promise<void> {
    try {
      const requestData: GrossToNetRequest = req.body;

      const result = SalaryCalculationService.calculateGrossToNet(requestData);

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Gross to net calculation completed successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error in gross to net calculation:', error);

      const response: ApiResponse = {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Gross to net calculation failed',
      };

      res.status(400).json(response);
    }
  }

  static async calculateNetToGross(req: Request, res: Response): Promise<void> {
    try {
      const requestData: NetToGrossRequest = req.body;

      const result = SalaryCalculationService.calculateNetToGross(requestData);

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Net to gross calculation completed successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error in net to gross calculation:', error);

      const response: ApiResponse = {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Net to gross calculation failed',
      };

      res.status(400).json(response);
    }
  }

  static async getSalaryLimits(req: Request, res: Response): Promise<void> {
    try {
      const year = req.query.year
        ? parseInt(req.query.year as string)
        : undefined;

      const limits = SalaryCalculationService.getSalaryLimits(year);

      const response: ApiResponse = {
        success: true,
        data: limits,
        message: 'Salary limits retrieved successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error getting salary limits:', error);

      const response: ApiResponse = {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get salary limits',
      };

      res.status(400).json(response);
    }
  }

  static async getTaxConfiguration(req: Request, res: Response): Promise<void> {
    try {
      const year = req.query.year
        ? parseInt(req.query.year as string)
        : new Date().getFullYear();

      const { TaxConfigurationService } = await import(
        '../services/taxConfiguration.service'
      );
      const config = TaxConfigurationService.getTaxConfiguration(year);

      const response: ApiResponse = {
        success: true,
        data: {
          year: config.year,
          brackets: config.brackets,
          sgkRates: config.sgkRates,
          stampTaxRate: config.stampTaxRate,
          minimumWage: config.minimumWage,
          minimumLivingAllowances: config.minimumLivingAllowances,
          disabilityDeductions: config.disabilityDeductions,
        },
        message: 'Tax configuration retrieved successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error getting tax configuration:', error);

      const response: ApiResponse = {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get tax configuration',
      };

      res.status(400).json(response);
    }
  }
}
