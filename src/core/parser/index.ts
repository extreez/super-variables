import { ImportToken, ImportSettings, ImportPayload } from '../types';
import { parseCSS } from './css';
import { parseJSON } from './json';

export class ImportParser {
  static parse(content: string, format: string, settings: ImportSettings): ImportPayload {
    let tokens: ImportToken[] = [];
    
    if (format === 'css' || format === 'scss' || format === 'less') {
      tokens = parseCSS(content, settings);
    } else if (format === 'json') {
      tokens = parseJSON(content, settings);
    }

    return {
      tokens,
      settings
    };
  }
}
