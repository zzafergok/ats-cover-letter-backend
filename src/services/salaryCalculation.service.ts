import {
  SalaryCalculationRequest,
  SalaryCalculationResult,
  GrossToNetRequest,
  NetToGrossRequest,
  SalaryBreakdown,
  TaxCalculationContext,
  SalaryValidationError,
  SalaryLimits,
} from '../types';
import { TaxCalculationService } from './taxCalculation.service';
import { TaxConfigurationService } from './taxConfiguration.service';
import logger from '../config/logger';

export class SalaryCalculationService {
  static calculateGrossToNet(
    request: GrossToNetRequest
  ): SalaryCalculationResult {
    try {
      this.validateGrossToNetRequest(request);

      const year = request.year || new Date().getFullYear();
      const month = request.month || new Date().getMonth() + 1;

      TaxCalculationService.validateSalaryLimits(request.grossSalary, year);

      const context: TaxCalculationContext = {
        year,
        month,
        cumulativeIncome: request.grossSalary * month,
        cumulativeTax: 0,
        isMarried: request.isMarried || false,
        dependentCount: request.dependentCount || 0,
        isDisabled: request.isDisabled || false,
        disabilityDegree: request.disabilityDegree,
      };

      const sgkContributions = TaxCalculationService.calculateSGKContributions(
        request.grossSalary,
        year
      );

      const taxableIncome =
        request.grossSalary -
        sgkContributions.employeeShare -
        sgkContributions.unemploymentEmployee;

      const incomeTaxResult = TaxCalculationService.calculateIncomeTax(
        taxableIncome,
        context
      );

      const stampTax = TaxCalculationService.calculateStampTax(
        request.grossSalary,
        year
      );

      const totalDeductions =
        sgkContributions.employeeShare +
        sgkContributions.unemploymentEmployee +
        incomeTaxResult.tax +
        stampTax;

      const netSalary = request.grossSalary - totalDeductions;
      const employerCost =
        request.grossSalary +
        sgkContributions.employerShare +
        sgkContributions.unemploymentEmployer;

      const config = TaxConfigurationService.getTaxConfiguration(year);
      const minimumLivingAllowance = this.calculateMinimumLivingAllowance(
        config,
        context
      );

      const breakdown: SalaryBreakdown = {
        taxableIncome,
        appliedTaxBracket: incomeTaxResult.appliedBracket,
        minimumWageExemption:
          TaxConfigurationService.isMinimumWageExemptForStampTax(year)
            ? Math.min(request.grossSalary, config.minimumWage.gross)
            : 0,
        minimumLivingAllowance,
        effectiveTaxRate: incomeTaxResult.effectiveRate,
      };

      return {
        grossSalary: request.grossSalary,
        netSalary,
        sgkEmployeeShare: sgkContributions.employeeShare,
        unemploymentInsurance: sgkContributions.unemploymentEmployee,
        incomeTax: incomeTaxResult.tax,
        stampTax,
        totalDeductions,
        employerCost,
        employerSgkShare: sgkContributions.employerShare,
        employerUnemploymentInsurance: sgkContributions.unemploymentEmployer,
        breakdown,
      };
    } catch (error) {
      logger.error('Error in gross to net calculation:', error);
      throw error;
    }
  }

  static calculateNetToGross(
    request: NetToGrossRequest
  ): SalaryCalculationResult {
    try {
      this.validateNetToGrossRequest(request);

      const maxIterations = request.maxIterations || 50;
      const precision = request.precision || 0.01;
      const year = request.year || new Date().getFullYear();
      const month = request.month || new Date().getMonth() + 1;

      let lowerBound = request.netSalary * 1.1;
      let upperBound = request.netSalary * 2.0;
      let bestGuess = request.netSalary * 1.3;

      for (let iteration = 0; iteration < maxIterations; iteration++) {
        const grossToNetRequest: GrossToNetRequest = {
          grossSalary: bestGuess,
          year,
          month,
          isMarried: request.isMarried,
          dependentCount: request.dependentCount,
          isDisabled: request.isDisabled,
          disabilityDegree: request.disabilityDegree,
        };

        const result = this.calculateGrossToNet(grossToNetRequest);
        const difference = result.netSalary - request.netSalary;

        if (Math.abs(difference) <= precision) {
          return result;
        }

        if (difference > 0) {
          upperBound = bestGuess;
        } else {
          lowerBound = bestGuess;
        }

        bestGuess = (lowerBound + upperBound) / 2;

        if (upperBound - lowerBound < precision) {
          const finalRequest: GrossToNetRequest = {
            grossSalary: bestGuess,
            year,
            month,
            isMarried: request.isMarried,
            dependentCount: request.dependentCount,
            isDisabled: request.isDisabled,
            disabilityDegree: request.disabilityDegree,
          };
          return this.calculateGrossToNet(finalRequest);
        }
      }

      throw new Error(
        `Could not converge to solution after ${maxIterations} iterations`
      );
    } catch (error) {
      logger.error('Error in net to gross calculation:', error);
      throw error;
    }
  }

  static calculateSalary(
    request: SalaryCalculationRequest
  ): SalaryCalculationResult {
    if (request.grossSalary && request.netSalary) {
      throw new Error(
        'Cannot specify both gross and net salary. Please provide only one.'
      );
    }

    if (!request.grossSalary && !request.netSalary) {
      throw new Error('Must specify either gross or net salary.');
    }

    if (request.grossSalary) {
      return this.calculateGrossToNet({
        grossSalary: request.grossSalary,
        year: request.year,
        month: request.month,
        isMarried: request.isMarried,
        dependentCount: request.dependentCount,
        isDisabled: request.isDisabled,
        disabilityDegree: request.disabilityDegree,
      });
    } else {
      return this.calculateNetToGross({
        netSalary: request.netSalary!,
        year: request.year,
        month: request.month,
        isMarried: request.isMarried,
        dependentCount: request.dependentCount,
        isDisabled: request.isDisabled,
        disabilityDegree: request.disabilityDegree,
      });
    }
  }

  static getSalaryLimits(year?: number): SalaryLimits {
    const currentYear = year || new Date().getFullYear();
    const { upperLimit } = TaxConfigurationService.getSGKLimits(currentYear);
    const { gross: minWageGross, net: minWageNet } =
      TaxConfigurationService.getMinimumWage(currentYear);

    return {
      minGrossSalary: minWageGross,
      maxGrossSalary: upperLimit,
      minNetSalary: minWageNet,
      maxNetSalary: upperLimit * 0.7,
    };
  }

  private static validateGrossToNetRequest(request: GrossToNetRequest): void {
    const errors: SalaryValidationError[] = [];

    if (!request.grossSalary || request.grossSalary <= 0) {
      errors.push({
        field: 'grossSalary',
        message: 'Gross salary must be a positive number',
        code: 'INVALID_GROSS_SALARY',
      });
    }

    if (
      request.year &&
      (request.year < 2024 || request.year > new Date().getFullYear() + 1)
    ) {
      errors.push({
        field: 'year',
        message: 'Year must be between 2024 and next year',
        code: 'INVALID_YEAR',
      });
    }

    if (request.month && (request.month < 1 || request.month > 12)) {
      errors.push({
        field: 'month',
        message: 'Month must be between 1 and 12',
        code: 'INVALID_MONTH',
      });
    }

    if (request.dependentCount && request.dependentCount < 0) {
      errors.push({
        field: 'dependentCount',
        message: 'Dependent count cannot be negative',
        code: 'INVALID_DEPENDENT_COUNT',
      });
    }

    if (
      request.disabilityDegree &&
      ![1, 2, 3].includes(request.disabilityDegree)
    ) {
      errors.push({
        field: 'disabilityDegree',
        message: 'Disability degree must be 1, 2, or 3',
        code: 'INVALID_DISABILITY_DEGREE',
      });
    }

    if (errors.length > 0) {
      throw new Error(
        `Validation errors: ${errors.map((e) => e.message).join(', ')}`
      );
    }
  }

  private static validateNetToGrossRequest(request: NetToGrossRequest): void {
    const errors: SalaryValidationError[] = [];

    if (!request.netSalary || request.netSalary <= 0) {
      errors.push({
        field: 'netSalary',
        message: 'Net salary must be a positive number',
        code: 'INVALID_NET_SALARY',
      });
    }

    if (
      request.maxIterations &&
      (request.maxIterations < 10 || request.maxIterations > 200)
    ) {
      errors.push({
        field: 'maxIterations',
        message: 'Max iterations must be between 10 and 200',
        code: 'INVALID_MAX_ITERATIONS',
      });
    }

    if (
      request.precision &&
      (request.precision <= 0 || request.precision > 10)
    ) {
      errors.push({
        field: 'precision',
        message: 'Precision must be between 0 and 10',
        code: 'INVALID_PRECISION',
      });
    }

    if (errors.length > 0) {
      throw new Error(
        `Validation errors: ${errors.map((e) => e.message).join(', ')}`
      );
    }
  }

  private static calculateMinimumLivingAllowance(
    config: any,
    context: TaxCalculationContext
  ): number {
    const allowance = config.minimumLivingAllowances[0];

    let totalAllowance = allowance.single;

    if (context.isMarried) {
      totalAllowance = allowance.married;
    }

    totalAllowance += context.dependentCount * allowance.perChild;

    return totalAllowance;
  }
}
