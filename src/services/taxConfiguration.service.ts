import { TaxConfiguration } from '../types';

export class TaxConfigurationService {
  private static configurations: Map<number, TaxConfiguration> = new Map();

  static getTaxConfiguration(year: number): TaxConfiguration {
    if (!this.configurations.has(year)) {
      this.configurations.set(year, this.createConfiguration(year));
    }
    return this.configurations.get(year)!;
  }

  private static createConfiguration(year: number): TaxConfiguration {
    if (year === 2025) {
      return this.get2025Configuration();
    }

    throw new Error(`Tax configuration not available for year ${year}`);
  }

  private static get2025Configuration(): TaxConfiguration {
    return {
      year: 2025,
      brackets: [
        { minAmount: 0, maxAmount: 158000, rate: 0.15, cumulativeTax: 0 },
        {
          minAmount: 158000,
          maxAmount: 330000,
          rate: 0.2,
          cumulativeTax: 23700,
        },
        {
          minAmount: 330000,
          maxAmount: 1200000,
          rate: 0.27,
          cumulativeTax: 58100,
        },
        {
          minAmount: 1200000,
          maxAmount: 4300000,
          rate: 0.35,
          cumulativeTax: 292900,
        },
        {
          minAmount: 4300000,
          maxAmount: null,
          rate: 0.4,
          cumulativeTax: 1377900,
        },
      ],
      sgkRates: {
        employeeRate: 0.14,
        employerRate: 0.2275,
        employerDiscountedRate: 0.1875,
        unemploymentEmployeeRate: 0.01,
        unemploymentEmployerRate: 0.02,
        shortTermInsuranceRate: 0.0225,
        lowerLimit: 26005.5,
        upperLimit: 195041.4,
      },
      stampTaxRate: 0.00759,
      minimumWage: {
        gross: 26005.5,
        net: 22104.67,
        daily: 866.85,
        hourly: 115.58,
      },
      minimumLivingAllowances: [
        {
          single: 14400,
          married: 18000,
          perChild: 3600,
        },
      ],
      disabilityDeductions: [
        { degree: 1, amount: 9900 },
        { degree: 2, amount: 5700 },
        { degree: 3, amount: 2400 },
      ],
    };
  }

  static getSGKLimits(year: number): {
    lowerLimit: number;
    upperLimit: number;
  } {
    const config = this.getTaxConfiguration(year);
    return {
      lowerLimit: config.sgkRates.lowerLimit,
      upperLimit: config.sgkRates.upperLimit,
    };
  }

  static getMinimumWage(year: number): { gross: number; net: number } {
    const config = this.getTaxConfiguration(year);
    return {
      gross: config.minimumWage.gross,
      net: config.minimumWage.net,
    };
  }

  static isMinimumWageExemptForStampTax(year: number): boolean {
    return year >= 2024;
  }
}
