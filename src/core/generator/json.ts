import { TokenData, CollectionData, ExportSettings, ExportFile } from '../types';
import { formatValue } from './utils';

export function generateJSONExport(
  tokens: TokenData[],
  collections: CollectionData[],
  settings: ExportSettings
): ExportFile[] {
  if (settings.format === 'json') {
    if (settings.platform === 'style-dictionary') {
      return [{ name: 'tokens.json', content: JSON.stringify(generateStyleDictionary(tokens, collections, settings), null, 2), type: 'json' }];
    } else if (settings.platform === 'dtcg') {
      return [{ name: 'tokens.json', content: JSON.stringify(generateDTCG(tokens, collections, settings), null, 2), type: 'json' }];
    } else {
      return [{ name: 'tokens.json', content: JSON.stringify(generateFlatJSON(tokens, collections, settings), null, 2), type: 'json' }];
    }
  }
  return [];
}

function generateFlatJSON(
  tokens: TokenData[],
  collections: CollectionData[],
  settings: ExportSettings
): any {
  const result: any = {};

  collections.forEach(col => {
    if (!settings.selectedCollectionIds.includes(col.id)) return;
    
    const firstModeId = col.modes[0].modeId;
    const colTokens = tokens.filter(t => t.collectionId === col.id);
    
    colTokens.forEach(t => {
      const val = t.valuesByMode[firstModeId];
      if (val) {
        result[t.name] = formatValue(val, settings, tokens, '', firstModeId);
      }
    });
  });

  return result;
}

function generateStyleDictionary(
  tokens: TokenData[],
  collections: CollectionData[],
  settings: ExportSettings
): any {
  const result: any = {};

  collections.forEach(col => {
    if (!settings.selectedCollectionIds.includes(col.id)) return;
    
    const firstModeId = col.modes[0].modeId;
    const colTokens = tokens.filter(t => t.collectionId === col.id);
    
    colTokens.forEach(t => {
      const val = t.valuesByMode[firstModeId];
      if (!val) return;

      const path = t.name.split('/');
      let current = result;
      
      path.forEach((p, i) => {
        if (i === path.length - 1) {
          current[p] = {
            value: formatValue(val, settings, tokens, '', firstModeId),
            type: t.resolvedType.toLowerCase(),
            comment: t.description,
            ...(settings.includeIds && { id: t.id })
          };
        } else {
          current[p] = current[p] || {};
          current = current[p];
        }
      });
    });
  });

  return result;
}

function generateDTCG(
  tokens: TokenData[],
  collections: CollectionData[],
  settings: ExportSettings
): any {
  // Design Tokens Community Group (DTCG) format
  const result: any = {};

  collections.forEach(col => {
    if (!settings.selectedCollectionIds.includes(col.id)) return;
    
    const firstModeId = col.modes[0].modeId;
    const colTokens = tokens.filter(t => t.collectionId === col.id);
    
    colTokens.forEach(t => {
      const val = t.valuesByMode[firstModeId];
      if (!val) return;

      const path = t.name.split('/');
      let current = result;
      
      path.forEach((p, i) => {
        if (i === path.length - 1) {
          current[p] = {
            $value: formatValue(val, settings, tokens, '', firstModeId),
            $type: t.resolvedType.toLowerCase(),
            $description: t.description,
            ...(settings.includeIds && { $id: t.id })
          };
        } else {
          current[p] = current[p] || {};
          current = current[p];
        }
      });
    });
  });

  return result;
}
