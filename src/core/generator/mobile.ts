import { TokenData, CollectionData, ExportSettings, ExportFile } from '../types';
import { convertColor } from './utils';

export function generateMobileExport(
  tokens: TokenData[],
  collections: CollectionData[],
  settings: ExportSettings
): ExportFile[] {
  const files: ExportFile[] = [];

  if (settings.format === 'swift') {
    files.push(...generateSwift(tokens, collections, settings));
  } else if (settings.format === 'xml') {
    files.push(...generateAndroidXML(tokens, collections, settings));
  } else if (settings.format === 'dart') {
    files.push(...generateFlutter(tokens, collections, settings));
  }

  return files;
}

function generateSwift(
  tokens: TokenData[],
  collections: CollectionData[],
  settings: ExportSettings
): ExportFile[] {
  let content = 'import SwiftUI\n\nstruct AppVariables {\n';

  collections.forEach(col => {
    if (!settings.selectedCollectionIds.includes(col.id)) return;
    
    const firstModeId = col.modes[0].modeId;
    content += `    // MARK: - ${col.name}\n`;
    
    const colTokens = tokens.filter(t => t.collectionId === col.id);
    colTokens.forEach(t => {
      const val = t.valuesByMode[firstModeId];
      if (!val) return;

      const camelName = t.name.replace(/\//g, '_').replace(/[^a-zA-Z0-9_]/g, '');
      
      if (val.type === 'color' || val.type === 'alias') {
        const colorValue = formatValue(val, { ...settings, colorFormat: 'rgba', aliasStrategy: 'resolve' }, tokens, '', firstModeId);
        // Simple regex to extract RGBA if it's a color
        const match = colorValue.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (match) {
           const r = (parseInt(match[1]) / 255).toFixed(3);
           const g = (parseInt(match[2]) / 255).toFixed(3);
           const b = (parseInt(match[3]) / 255).toFixed(3);
           const a = (match[4] ? parseFloat(match[4]) : 1).toFixed(3);
           content += `    static let ${camelName} = Color(red: ${r}, green: ${g}, blue: ${b}, opacity: ${a})\n`;
        } else {
           content += `    static let ${camelName} = Color("${colorValue}")\n`;
        }
      } else if (val.type === 'float') {
        content += `    static let ${camelName}: CGFloat = ${formatValue(val, settings, tokens, '', firstModeId)}\n`;
      } else if (val.type === 'string') {
        content += `    static let ${camelName} = "${val.value}"\n`;
      } else if (val.type === 'boolean') {
        content += `    static let ${camelName} = ${val.value}\n`;
      }
    });
    content += '\n';
  });

  content += '}\n';
  return [{ name: 'Variables.swift', content, type: 'text' }];
}

function generateAndroidXML(
  tokens: TokenData[],
  collections: CollectionData[],
  settings: ExportSettings
): ExportFile[] {
  let content = '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n';

  collections.forEach(col => {
    if (!settings.selectedCollectionIds.includes(col.id)) return;
    
    const firstModeId = col.modes[0].modeId;
    content += `    <!-- ${col.name} -->\n`;
    
    const colTokens = tokens.filter(t => t.collectionId === col.id);
    colTokens.forEach(t => {
      const val = t.valuesByMode[firstModeId];
      if (!val) return;

      const xmlName = t.name.toLowerCase().replace(/\//g, '_').replace(/[^a-z0-9_]/g, '_');
      
      if (val.type === 'color') {
        const hex = convertColor(val, 'hex');
        content += `    <color name="${xmlName}">${hex}</color>\n`;
      } else if (val.type === 'float') {
        content += `    <dimen name="${xmlName}">${val.value}dp</dimen>\n`;
      } else if (val.type === 'string') {
        content += `    <string name="${xmlName}">${val.value}</string>\n`;
      } else if (val.type === 'boolean') {
        content += `    <bool name="${xmlName}">${val.value}</bool>\n`;
      }
    });
    content += '\n';
  });

  content += '</resources>\n';
  return [{ name: 'variables.xml', content, type: 'text' }];
}

function generateFlutter(
  tokens: TokenData[],
  collections: CollectionData[],
  settings: ExportSettings
): ExportFile[] {
  let content = 'import \'package:flutter/material.dart\';\n\nclass AppVariables {\n';

  collections.forEach(col => {
    if (!settings.selectedCollectionIds.includes(col.id)) return;
    
    const firstModeId = col.modes[0].modeId;
    content += `  // ${col.name}\n`;
    
    const colTokens = tokens.filter(t => t.collectionId === col.id);
    colTokens.forEach(t => {
      const val = t.valuesByMode[firstModeId];
      if (!val) return;

      const camelName = t.name.replace(/\//g, '_').replace(/[^a-zA-Z0-9_]/g, '');
      
      if (val.type === 'color') {
        const a = Math.round(val.a * 255).toString(16).padStart(2, '0');
        const r = Math.round(val.r * 255).toString(16).padStart(2, '0');
        const g = Math.round(val.g * 255).toString(16).padStart(2, '0');
        const b = Math.round(val.b * 255).toString(16).padStart(2, '0');
        content += `  static const Color ${camelName} = Color(0x${a}${r}${g}${b});\n`;
      } else if (val.type === 'float') {
        content += `  static const double ${camelName} = ${val.value};\n`;
      } else if (val.type === 'string') {
        content += `  static const String ${camelName} = '${val.value}';\n`;
      } else if (val.type === 'boolean') {
        content += `  static const bool ${camelName} = ${val.value};\n`;
      }
    });
    content += '\n';
  });

  content += '}\n';
  return [{ name: 'variables.dart', content, type: 'text' }];
}
