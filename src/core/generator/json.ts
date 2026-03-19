import { TokenData, CollectionData, ExportSettings, ExportFile, TokenValue } from '../types';
import { formatValue } from './utils';

export function generateJSONExport(
  tokens: TokenData[],
  collections: CollectionData[],
  settings: ExportSettings
): ExportFile[] {
  if (settings.format !== 'json') return [];

  // Separate files strategy
  if (settings.modeStrategy === 'separate-files') {
    const files: ExportFile[] = [];
    
    collections.forEach(col => {
      if (!settings.selectedCollectionIds.includes(col.id)) return;
      
      const modeIds = settings.selectedModeIds[col.id] || col.modes.map(m => m.modeId);
      modeIds.forEach(modeId => {
        const mode = col.modes.find(m => m.modeId === modeId);
        if (!mode) return;
        
        const content = generateStructuredJSON(tokens, col, modeId, settings);
        files.push({
          name: `${col.name.toLowerCase().replace(/\s+/g, '-')}.${mode.name.toLowerCase().replace(/\s+/g, '-')}.json`,
          content: JSON.stringify(content, null, 2),
          type: 'json'
        });
      });
    });
    
    return files;
  }

  // Combined file strategy: Nest by collection and mode
  const result: any = {
    collections: {}
  };

  collections.forEach(col => {
    if (!settings.selectedCollectionIds.includes(col.id)) return;
    
    result.collections[col.name] = {
      id: col.id,
      modes: {}
    };
    
    const modeIds = settings.selectedModeIds[col.id] || col.modes.map(m => m.modeId);
    modeIds.forEach(modeId => {
      const mode = col.modes.find(m => m.modeId === modeId);
      if (!mode) return;
      
      result.collections[col.name].modes[mode.name] = generateStructuredJSON(tokens, col, modeId, settings);
    });
  });

  return [{ 
    name: 'tokens.json', 
    content: JSON.stringify(result, null, 2), 
    type: 'json' 
  }];
}

/**
 * Generates a structured JSON for a specific collection and mode
 */
function generateStructuredJSON(
  tokens: TokenData[],
  collection: CollectionData,
  modeId: string,
  settings: ExportSettings
): any {
  const colTokens = tokens.filter(t => t.collectionId === collection.id);

  if (settings.platform === 'style-dictionary') {
    const result: any = {};
    colTokens.forEach(t => {
      const val = t.valuesByMode[modeId];
      if (!val) return;

      const path = t.name.split('/');
      let current = result;
      
      path.forEach((p, i) => {
        if (i === path.length - 1) {
          current[p] = {
            value: formatValue(val, settings, tokens, '', modeId),
            type: t.resolvedType.toLowerCase(),
            comment: t.description,
            ...(settings.includeIds && { id: t.id }),
            ...(settings.includeCustomIds && { customId: t.customId || t.id })
          };
        } else {
          current[p] = current[p] || {};
          current = current[p];
        }
      });
    });
    return result;
  }

  if (settings.platform === 'dtcg') {
    const result: any = {};
    colTokens.forEach(t => {
      const val = t.valuesByMode[modeId];
      if (!val) return;

      const path = t.name.split('/');
      let current = result;
      
      path.forEach((p, i) => {
        if (i === path.length - 1) {
          current[p] = {
            $value: formatValue(val, settings, tokens, '', modeId),
            $type: t.resolvedType.toLowerCase(),
            $description: t.description,
            ...(settings.includeIds && { $id: t.id }),
            ...(settings.includeCustomIds && { $customId: t.customId || t.id })
          };
        } else {
          current[p] = current[p] || {};
          current = current[p];
        }
      });
    });
    return result;
  }

  // Default: Flat Map
  const result: any = {};
  colTokens.forEach(t => {
    const val = t.valuesByMode[modeId];
    if (val) {
      if (settings.includeCustomIds) {
        result[t.name] = {
          value: formatValue(val, settings, tokens, '', modeId),
          customId: t.customId || t.id,
          type: t.resolvedType.toLowerCase()
        };
      } else {
        result[t.name] = formatValue(val, settings, tokens, '', modeId);
      }
    }
  });
  return result;
}
