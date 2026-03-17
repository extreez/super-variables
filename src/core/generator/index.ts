import { TokenData, CollectionData, ExportSettings, ExportResult, ExportFile } from '../types';
import { generateWebExport } from './web';
import { generateMobileExport } from './mobile';
import { generateJSONExport } from './json';

export class ExportGenerator {
  static generate(
    tokens: TokenData[],
    collections: CollectionData[],
    settings: ExportSettings
  ): ExportResult {
    let files: ExportFile[] = [];

    switch (settings.platform) {
      case 'web':
        files = generateWebExport(tokens, collections, settings);
        break;
      case 'ios':
      case 'android':
      case 'flutter':
        files = generateMobileExport(tokens, collections, settings);
        break;
      case 'style-dictionary':
      case 'dtcg':
      case 'json':
        files = generateJSONExport(tokens, collections, settings);
        break;
      default:
        files = generateWebExport(tokens, collections, settings);
    }

    // Add Scopes config if requested
    if (settings.includeScopes) {
      files.push(this.generateScopesFile(tokens, collections, settings));
    }

    return { files };
  }

  private static generateScopesFile(
    tokens: TokenData[],
    collections: CollectionData[],
    settings: ExportSettings
  ): ExportFile {
    const scopes: any = {};

    tokens.forEach(t => {
      if (!settings.selectedCollectionIds.includes(t.collectionId)) return;
      scopes[t.name] = t.scopes;
    });

    return {
      name: 'scopes.json',
      content: JSON.stringify(scopes, null, 2),
      type: 'json'
    };
  }
}
