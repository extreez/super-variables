import { ImportToken, ImportSettings } from '../types';

export function parseJSON(content: string, settings: ImportSettings): ImportToken[] {
  const tokens: ImportToken[] = [];
  
  try {
    const data = JSON.parse(content);
    
    // Check if it's an array of tokens or a nested object
    if (Array.isArray(data)) {
      // Handle flat array format if someone manually created it
      data.forEach(item => {
        if (item.name && item.value !== undefined) {
          tokens.push({
            name: item.name,
            value: String(item.value),
            type: item.type,
            collection: item.collection || settings.targetCollectionId || 'Imported',
            mode: item.mode || settings.targetModeId || 'default',
            isAlias: String(item.value).includes('{')
          });
        }
      });
    } else {
      // Handle nested object (Standard, DTCG, Style Dictionary)
      flattenObject(data, '', tokens, settings);
    }
  } catch (e) {
    console.error("Failed to parse JSON", e);
  }

  return tokens;
}

function flattenObject(obj: any, currentPath: string, tokens: ImportToken[], settings: ImportSettings) {
  for (const [key, value] of Object.entries(obj)) {
    const path = currentPath ? `${currentPath}/${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Check if it's a token node (DTCG or Style Dictionary)
      if ('value' in value || '$value' in value) {
        const val = value.value || value.$value;
        const type = value.type || value.$type;
        const isAlias = typeof val === 'string' && val.includes('{');
        
        let finalValue = String(val);
        if (isAlias) {
          // extract 'color.brand.500' from '{color.brand.500}'
          const aliasMatch = finalValue.match(/\{([^}]+)\}/);
          if (aliasMatch) {
            // we assume JSON paths use dots or whatever was exported.
            // If they exported with -- divider, it's weird for JSON, usually it's nested so it becomes a/b/c
            // If the alias uses dots, convert to slashes
            finalValue = aliasMatch[1].replace(/\./g, '/');
          }
        }

        tokens.push({
          name: path,
          value: finalValue,
          type: typeof type === 'string' ? type.toUpperCase() : undefined,
          collection: settings.targetCollectionId || 'Imported',
          mode: settings.targetModeId || 'default',
          isAlias
        });
      } else {
        flattenObject(value, path, tokens, settings);
      }
    } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      // Simple flat JSON or leaf node
      const isAlias = typeof value === 'string' && value.includes('{');
      
      let finalValue = String(value);
      if (isAlias) {
        const aliasMatch = finalValue.match(/\{([^}]+)\}/);
        if (aliasMatch) {
          finalValue = aliasMatch[1].replace(/\./g, '/');
        }
      }

      tokens.push({
        name: path,
        value: finalValue,
        collection: settings.targetCollectionId || 'Imported',
        mode: settings.targetModeId || 'default',
        isAlias
      });
    }
  }
}
