import { TokenData, CollectionData, ExportSettings, ExportFile, TokenValue } from '../types';
import { formatName, formatValue } from './utils';

export function generateWebExport(
  tokens: TokenData[],
  collections: CollectionData[],
  settings: ExportSettings
): ExportFile[] {
  const files: ExportFile[] = [];

  if (settings.format === 'css') {
    files.push(...generateCSS(tokens, collections, settings));
  } else if (settings.format === 'scss' || settings.format === 'less' || settings.format === 'sass') {
    files.push(...generatePreprocessors(tokens, collections, settings));
  } else if (settings.format === 'tailwind') {
    files.push(...generateTailwind(tokens, collections, settings));
  }

  return files;
}

function generateCSS(
  tokens: TokenData[],
  collections: CollectionData[],
  settings: ExportSettings
): ExportFile[] {
  if (settings.modeStrategy === 'separate-files') {
    return generateCSSSeparateFiles(tokens, collections, settings);
  }

  // Combined file (selectors or root comments)
  let content = `/* --- SUPER_VARIABLES_CONFIG: ${JSON.stringify({ 
    platform: settings.platform, 
    format: settings.format, 
    colorFormat: settings.colorFormat,
    unitSystem: settings.unitSystem,
    baseFontSize: settings.baseFontSize,
    groupDivider: settings.groupDivider
  })} --- */\n\n`;
  
  if (settings.modeStrategy === 'root-comments') {
    content += ':root {\n';
    collections.forEach(col => {
      if (!settings.selectedCollectionIds.includes(col.id)) return;
      
      const modeIds = settings.selectedModeIds[col.id] || [col.modes[0].modeId];
      modeIds.forEach(modeId => {
        const modeName = col.modes.find(m => m.modeId === modeId)?.name || 'default';
        content += `  /* --- Collection: ${col.name}, Mode: ${modeName} --- */\n`;
        
        const colTokens = tokens.filter(t => t.collectionId === col.id);
        colTokens.forEach(t => {
          const val = t.valuesByMode[modeId];
          if (val) {
            const varName = formatName(t.name, settings.groupDivider, '--');
            content += `  ${varName}: ${formatValue(val, settings, tokens, '--', modeId)};\n`;
          }
        });
        content += '\n';
      });
    });
    content += '}\n';
  } else if (settings.modeStrategy === 'selectors') {
    collections.forEach(col => {
      if (!settings.selectedCollectionIds.includes(col.id)) return;
      
      const modeIds = settings.selectedModeIds[col.id] || col.modes.map(m => m.modeId);
      modeIds.forEach(modeId => {
        const mode = col.modes.find(m => m.modeId === modeId);
        if (!mode) return;
        
        const selector = settings.selectorTemplate 
          ? settings.selectorTemplate.replace('{modeName}', mode.name.toLowerCase().replace(/\s+/g, '-'))
          : `.${mode.name.toLowerCase().replace(/\s+/g, '-')}`;
        
        content += `${selector} {\n`;
        const colTokens = tokens.filter(t => t.collectionId === col.id);
        colTokens.forEach(t => {
          const val = t.valuesByMode[modeId];
          if (val) {
            const varName = formatName(t.name, settings.groupDivider, '--');
            content += `  ${varName}: ${formatValue(val, settings, tokens, '--', modeId)};\n`;
          }
        });
        content += '}\n\n';
      });
    });
  }

  return [{ name: 'variables.css', content, type: 'text' }];
}

function generateCSSSeparateFiles(
  tokens: TokenData[],
  collections: CollectionData[],
  settings: ExportSettings
): ExportFile[] {
  const files: ExportFile[] = [];

  collections.forEach(col => {
    if (!settings.selectedCollectionIds.includes(col.id)) return;
    
    const modeIds = settings.selectedModeIds[col.id] || col.modes.map(m => m.modeId);
    modeIds.forEach(modeId => {
      const mode = col.modes.find(m => m.modeId === modeId);
      if (!mode) return;

      let content = `:root {\n`;
      const colTokens = tokens.filter(t => t.collectionId === col.id);
      colTokens.forEach(t => {
        const val = t.valuesByMode[modeId];
        if (val) {
          const varName = formatName(t.name, settings.groupDivider, '--');
          content += `  ${varName}: ${formatValue(val, settings, tokens, '--', modeId)};\n`;
        }
      });
      content += '}\n';
      
      files.push({
        name: `${col.name.toLowerCase().replace(/\s+/g, '-')}-${mode.name.toLowerCase().replace(/\s+/g, '-')}.css`,
        content,
        type: 'text'
      });
    });
  });

  return files;
}

function generatePreprocessors(
  tokens: TokenData[],
  collections: CollectionData[],
  settings: ExportSettings
): ExportFile[] {
  const prefix = settings.format === 'scss' || settings.format === 'sass' ? '$' : '@';
  const ext = settings.format;
  let content = '';

  collections.forEach(col => {
    if (!settings.selectedCollectionIds.includes(col.id)) return;
    
    // For preprocessors, we usually take the first mode or separate them by comments
    const firstModeId = col.modes[0].modeId;
    content += `// Collection: ${col.name}\n`;
    
    const colTokens = tokens.filter(t => t.collectionId === col.id);
    colTokens.forEach(t => {
      const val = t.valuesByMode[firstModeId];
      if (val) {
        const varName = formatName(t.name, settings.groupDivider, prefix);
        content += `${varName}: ${formatValue(val, settings, tokens, prefix, firstModeId)};\n`;
      }
    });
    content += '\n';
  });

  return [{ name: `variables.${ext}`, content, type: 'text' }];
}

function generateTailwind(
  tokens: TokenData[],
  collections: CollectionData[],
  settings: ExportSettings
): ExportFile[] {
  const config: any = {
    theme: {
      extend: {}
    }
  };

  collections.forEach(col => {
    if (!settings.selectedCollectionIds.includes(col.id)) return;
    
    const firstModeId = col.modes[0].modeId;
    const colTokens = tokens.filter(t => t.collectionId === col.id);
    
    colTokens.forEach(t => {
      const val = t.valuesByMode[firstModeId];
      if (!val) return;

      const path = t.name.split('/');
      let current = config.theme.extend;
      
      // Basic heuristic for Tailwind categories
      let category = 'colors';
      if (t.resolvedType === 'FLOAT') {
        if (t.name.toLowerCase().includes('radius')) category = 'borderRadius';
        else if (t.name.toLowerCase().includes('spacing')) category = 'spacing';
        else category = 'fontSize'; // default float
      }

      current[category] = current[category] || {};
      current = current[category];

      path.forEach((p, i) => {
        if (i === path.length - 1) {
          current[p] = formatValue(val, settings, tokens, '', firstModeId);
        } else {
          current[p] = current[p] || {};
          current = current[p];
        }
      });
    });
  });

  const content = `/** @type {import('tailwindcss').Config} */\nmodule.exports = ${JSON.stringify(config, null, 2)};`;
  return [{ name: 'tailwind.config.js', content, type: 'text' }];
}
