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

    const allTokens = tokens;
    const activeTokens = allTokens.filter(t => !t.isDeleted);
    const deletedPaths = Array.from(new Set(allTokens.filter(t => t.isDeleted).map(t => t.name)));

    const payload: ImportPayload = {
      tokens: activeTokens,
      settings
    };

    if (deletedPaths.length > 0) {
      payload.changes = {
        deletions: deletedPaths
      };
    }

    return payload;
  }
}
