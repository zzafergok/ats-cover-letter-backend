import * as fs from 'fs';
import * as XLSX from 'xlsx';
import * as path from 'path';

import logger from '../config/logger';

import { createErrorMessage, SERVICE_MESSAGES } from '../constants/messages';

export interface HighSchool {
  id: string;
  name: string;
  city?: string;
  district?: string;
  type?: string;
}

export class HighSchoolService {
  private static highSchools: HighSchool[] = [];
  private static isLoaded = false;
  private static readonly DATA_FILE_PATH = path.join(
    process.cwd(),
    'src',
    'data',
    'high-schools.xlsx'
  );

  private static loadHighSchools(): void {
    try {
      if (!fs.existsSync(this.DATA_FILE_PATH)) {
        logger.warn(
          `High schools data file not found at: ${this.DATA_FILE_PATH}`
        );
        return;
      }

      const workbook = XLSX.readFile(this.DATA_FILE_PATH);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      this.highSchools = data
        .map((row: any, index: number) => ({
          id: (index + 1).toString(),
          name: row['Kurum Adı '] || row['Okul Adı'] || row['name'] || row['Name'] || '',
          city: row['İl'] || row['city'] || row['City'] || '',
          district: row['İlçe'] || row['district'] || row['District'] || '',
          type: row['Tür'] || row['type'] || row['Type'] || '',
        }))
        .filter((school) => school.name.trim() !== '');

      this.isLoaded = true;
      logger.info(
        `Loaded ${this.highSchools.length} high schools from Excel file`
      );
    } catch (error) {
      logger.error('Error loading high schools data:', error);
      this.highSchools = [];
    }
  }

  public static getAllHighSchools(): HighSchool[] {
    if (!this.isLoaded) {
      this.loadHighSchools();
    }
    return this.highSchools;
  }

  public static searchHighSchools(query: string): HighSchool[] {
    if (!this.isLoaded) {
      this.loadHighSchools();
    }

    if (!query || query.trim().length < 2) {
      return this.highSchools;
    }

    const searchTerm = query.toLowerCase().trim();
    const filtered = this.highSchools.filter(
      (school) =>
        school.name.toLowerCase().includes(searchTerm) ||
        school.city?.toLowerCase().includes(searchTerm) ||
        school.district?.toLowerCase().includes(searchTerm)
    );

    return filtered;
  }

  public static getHighSchoolsByCity(city: string): HighSchool[] {
    if (!this.isLoaded) {
      this.loadHighSchools();
    }

    if (!city) {
      return [];
    }

    return this.highSchools.filter(
      (school) => school.city?.toLowerCase() === city.toLowerCase()
    );
  }

  public static getHighSchoolById(id: string): HighSchool | null {
    if (!this.isLoaded) {
      this.loadHighSchools();
    }

    return this.highSchools.find((school) => school.id === id) || null;
  }

  public static reloadData(): void {
    this.isLoaded = false;
    this.loadHighSchools();
  }

  public static getStats(): {
    total: number;
    cities: number;
    isLoaded: boolean;
  } {
    if (!this.isLoaded) {
      this.loadHighSchools();
    }

    const uniqueCities = new Set(
      this.highSchools
        .map((school) => school.city)
        .filter((city) => city && city.trim() !== '')
    );

    return {
      total: this.highSchools.length,
      cities: uniqueCities.size,
      isLoaded: this.isLoaded,
    };
  }
}

export default HighSchoolService;
