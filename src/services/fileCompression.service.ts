import { gzip, gunzip, constants } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

export class FileCompressionService {
  private static instance: FileCompressionService;

  public static getInstance(): FileCompressionService {
    if (!FileCompressionService.instance) {
      FileCompressionService.instance = new FileCompressionService();
    }
    return FileCompressionService.instance;
  }

  public async compressFile(buffer: Buffer): Promise<Buffer> {
    try {
      const compressed = await gzipAsync(buffer, {
        level: constants.Z_BEST_COMPRESSION,
      });
      return compressed;
    } catch (error) {
      console.error('Dosya sıkıştırma hatası:', error);
      throw new Error('COMPRESS_001: Dosya sıkıştırılamadı');
    }
  }

  public async decompressFile(compressedBuffer: Buffer): Promise<Buffer> {
    try {
      const decompressed = await gunzipAsync(compressedBuffer);
      return decompressed;
    } catch (error) {
      console.error('Dosya açma hatası:', error);
      throw new Error('COMPRESS_002: Sıkıştırılmış dosya açılamadı');
    }
  }

  public calculateCompressionRatio(
    originalSize: number,
    compressedSize: number
  ): number {
    return ((originalSize - compressedSize) / originalSize) * 100;
  }
}
