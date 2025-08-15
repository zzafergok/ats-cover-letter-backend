import { TaxBracket, TaxCalculationContext, TaxConfiguration } from '../types';
import { TaxConfigurationService } from './taxConfiguration.service';

export class TaxCalculationService {
  static calculateIncomeTax(
    taxableIncome: number,
    context: TaxCalculationContext
  ): { tax: number; appliedBracket: TaxBracket; effectiveRate: number } {
    const config = TaxConfigurationService.getTaxConfiguration(context.year);

    const minimumLivingAllowance = this.calculateMinimumLivingAllowance(
      config,
      context
    );
    const disabilityDeduction = this.calculateDisabilityDeduction(
      config,
      context
    );

    const adjustedIncome = Math.max(
      0,
      taxableIncome - minimumLivingAllowance - disabilityDeduction
    );

    let tax = 0;
    let appliedBracket: TaxBracket = config.brackets[0];

    for (const bracket of config.brackets) {
      if (adjustedIncome > bracket.minAmount) {
        const taxableInBracket = bracket.maxAmount
          ? Math.min(
              adjustedIncome - bracket.minAmount,
              bracket.maxAmount - bracket.minAmount
            )
          : adjustedIncome - bracket.minAmount;

        tax = bracket.cumulativeTax + taxableInBracket * bracket.rate;
        appliedBracket = bracket;
      } else {
        break;
      }
    }

    const effectiveRate = adjustedIncome > 0 ? tax / adjustedIncome : 0;

    return {
      tax: Math.max(0, tax),
      appliedBracket,
      effectiveRate,
    };
  }

  static calculateSGKContributions(
    grossSalary: number,
    year: number
  ): {
    employeeShare: number;
    employerShare: number;
    unemploymentEmployee: number;
    unemploymentEmployer: number;
    sgkBase: number;
  } {
    const config = TaxConfigurationService.getTaxConfiguration(year);
    const { lowerLimit, upperLimit } = config.sgkRates;

    const sgkBase = Math.min(Math.max(grossSalary, lowerLimit), upperLimit);

    return {
      employeeShare: sgkBase * config.sgkRates.employeeRate,
      employerShare: sgkBase * config.sgkRates.employerDiscountedRate,
      unemploymentEmployee: sgkBase * config.sgkRates.unemploymentEmployeeRate,
      unemploymentEmployer: sgkBase * config.sgkRates.unemploymentEmployerRate,
      sgkBase,
    };
  }

  static calculateStampTax(grossSalary: number, year: number): number {
    const config = TaxConfigurationService.getTaxConfiguration(year);

    if (TaxConfigurationService.isMinimumWageExemptForStampTax(year)) {
      const exemptAmount = Math.min(grossSalary, config.minimumWage.gross);
      const taxableAmount = Math.max(0, grossSalary - exemptAmount);
      return taxableAmount * config.stampTaxRate;
    }

    return grossSalary * config.stampTaxRate;
  }

  private static calculateMinimumLivingAllowance(
    config: TaxConfiguration,
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

  private static calculateDisabilityDeduction(
    config: TaxConfiguration,
    context: TaxCalculationContext
  ): number {
    if (!context.isDisabled || !context.disabilityDegree) {
      return 0;
    }

    const deduction = config.disabilityDeductions.find(
      (d) => d.degree === context.disabilityDegree
    );
    return deduction ? deduction.amount : 0;
  }

  static validateSalaryLimits(grossSalary: number, year: number): void {
    const config = TaxConfigurationService.getTaxConfiguration(year);

    if (grossSalary < 0) {
      throw new Error('Gross salary cannot be negative');
    }

    if (grossSalary > config.sgkRates.upperLimit * 12) {
      throw new Error(
        `Gross salary cannot exceed annual limit of ${config.sgkRates.upperLimit * 12} TL`
      );
    }
  }
}
