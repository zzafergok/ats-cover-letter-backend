export interface SalaryCalculationRequest {
  grossSalary?: number;
  netSalary?: number;
  year: number;
  month: number;
  isMarried?: boolean;
  dependentCount?: number;
  isDisabled?: boolean;
  disabilityDegree?: 1 | 2 | 3;
}

export interface SalaryCalculationResult {
  grossSalary: number;
  netSalary: number;
  sgkEmployeeShare: number;
  unemploymentInsurance: number;
  incomeTax: number;
  stampTax: number;
  totalDeductions: number;
  employerCost: number;
  employerSgkShare: number;
  employerUnemploymentInsurance: number;
  breakdown: SalaryBreakdown;
}

export interface SalaryBreakdown {
  taxableIncome: number;
  appliedTaxBracket: TaxBracket;
  minimumWageExemption: number;
  minimumLivingAllowance: number;
  effectiveTaxRate: number;
}

export interface TaxBracket {
  minAmount: number;
  maxAmount: number | null;
  rate: number;
  cumulativeTax: number;
}

export interface TaxConfiguration {
  year: number;
  brackets: TaxBracket[];
  sgkRates: SGKRates;
  stampTaxRate: number;
  minimumWage: MinimumWage;
  minimumLivingAllowances: MinimumLivingAllowance[];
  disabilityDeductions: DisabilityDeduction[];
}

export interface SGKRates {
  employeeRate: number;
  employerRate: number;
  employerDiscountedRate: number;
  unemploymentEmployeeRate: number;
  unemploymentEmployerRate: number;
  shortTermInsuranceRate: number;
  lowerLimit: number;
  upperLimit: number;
}

export interface MinimumWage {
  gross: number;
  net: number;
  daily: number;
  hourly: number;
}

export interface MinimumLivingAllowance {
  single: number;
  married: number;
  perChild: number;
}

export interface DisabilityDeduction {
  degree: 1 | 2 | 3;
  amount: number;
}

export interface SalaryValidationError {
  field: string;
  message: string;
  code: string;
}

export interface GrossToNetRequest {
  grossSalary: number;
  year?: number;
  month?: number;
  isMarried?: boolean;
  dependentCount?: number;
  isDisabled?: boolean;
  disabilityDegree?: 1 | 2 | 3;
}

export interface NetToGrossRequest {
  netSalary: number;
  year?: number;
  month?: number;
  isMarried?: boolean;
  dependentCount?: number;
  isDisabled?: boolean;
  disabilityDegree?: 1 | 2 | 3;
  maxIterations?: number;
  precision?: number;
}

export interface SalaryLimits {
  minGrossSalary: number;
  maxGrossSalary: number;
  minNetSalary: number;
  maxNetSalary: number;
}

export interface TaxCalculationContext {
  year: number;
  month: number;
  cumulativeIncome: number;
  cumulativeTax: number;
  isMarried: boolean;
  dependentCount: number;
  isDisabled: boolean;
  disabilityDegree?: 1 | 2 | 3;
}
