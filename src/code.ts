// Super Variables — Plugin Code (Figma Sandbox)
// Reads variables from Figma and sends structured data to UI.

import { CollectionData, TokenData, TokenValue, VariablesPayload } from './core/types';

figma.showUI(__html__, {
  width: 900,
  height: 620,
  themeColors: true,
  title: 'Super Variables',
});

// Update UI when Figma variables change
figma.on("documentchange", async (event) => {
  const hasVariableChanges = event.documentChanges.some(change => 
    change.type === 'PROPERTY_CHANGE' && 
    ((change.properties as any).includes('name') || (change.properties as any).includes('valuesByMode'))
  );

  if (hasVariableChanges) {
    const data = await readVariables();
    figma.ui.postMessage({ type: 'variables-loaded', payload: data });
  }
});

// === Read variables from Figma ===

async function readVariables(): Promise<VariablesPayload> {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const variables = await figma.variables.getLocalVariablesAsync();

  // Build a lookup map for resolving aliases
  const variableMap = new Map<string, Variable>();
  for (const v of variables) {
    variableMap.set(v.id, v);
  }

  // Map collections
  const collectionDataList: CollectionData[] = collections.map(col => ({
    id: col.id,
    name: col.name,
    modes: col.modes.map(m => ({ modeId: m.modeId, name: m.name })),
    variableCount: col.variableIds.length,
  }));

  // Map variables (tokens)
  const tokenDataList: TokenData[] = variables.map(v => {
    const valuesByMode: Record<string, TokenValue> = {};

    for (const [modeId, rawValue] of Object.entries(v.valuesByMode)) {
      valuesByMode[modeId] = convertValue(rawValue, v.resolvedType, variableMap);
    }

    return {
      id: v.id,
      name: v.name,
      resolvedType: v.resolvedType,
      valuesByMode,
      collectionId: v.variableCollectionId,
      scopes: [...v.scopes],
    };
  });

  return {
    fileName: figma.root.name,
    collections: collectionDataList,
    tokens: tokenDataList,
  };
}

// Convert a Figma variable value to our serializable format
function convertValue(
  rawValue: VariableValue,
  resolvedType: VariableResolvedDataType,
  variableMap: Map<string, Variable>
): TokenValue {
  // Check if it's an alias
  if (typeof rawValue === 'object' && rawValue !== null && 'type' in rawValue) {
    const alias = rawValue as VariableAlias;
    if (alias.type === 'VARIABLE_ALIAS') {
      const target = variableMap.get(alias.id);
      return {
        type: 'alias',
        id: alias.id,
        name: target ? target.name : '(unknown)',
      };
    }
  }

  // Concrete values
  switch (resolvedType) {
    case 'COLOR': {
      const color = rawValue as RGBA;
      return { type: 'color', r: color.r, g: color.g, b: color.b, a: color.a };
    }
    case 'FLOAT':
      return { type: 'float', value: rawValue as number };
    case 'STRING':
      return { type: 'string', value: rawValue as string };
    case 'BOOLEAN':
      return { type: 'boolean', value: rawValue as boolean };
    default:
      return { type: 'string', value: String(rawValue) };
  }
}

// === Write variables to Figma ===

async function importVariables(payload: { mode: 'create' | 'update'; data: any }) {
  const { data } = payload;
  
  // For simplicity, we'll use/create a collection named "Imported"
  let collection = (await figma.variables.getLocalVariableCollectionsAsync()).find(c => c.name === 'Imported');
  if (!collection) {
    collection = figma.variables.createVariableCollection('Imported');
  }
  
  const modeId = collection.modes[0].modeId;

  // Flatten the nested JSON and create variables
  const processObject = (obj: any, path: string = '') => {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}/${key}` : key;
      
      if (typeof value === 'object' && value !== null && !('r' in value)) {
        processObject(value, currentPath);
      } else {
        // Create or find variable
        let variable = figma.variables.getLocalVariables().find(v => v.name === currentPath && v.variableCollectionId === collection!.id);
        
        const type = getVariableType(value);
        if (!variable) {
          variable = figma.variables.createVariable(currentPath, collection!.id, type);
        }
        
        const figmaValue = convertToFigmaValue(value, type);
        variable.setValueForMode(modeId, figmaValue);
      }
    }
  };

  processObject(data);
  figma.notify('Variables imported successfully');
  
  // Refresh data in UI
  const updatedData = await readVariables();
  figma.ui.postMessage({ type: 'variables-loaded', payload: updatedData });
}

function getVariableType(value: any): VariableResolvedDataType {
  if (typeof value === 'string') {
    if (value.startsWith('#') || value.startsWith('rgba') || value.startsWith('rgb')) return 'COLOR';
    return 'STRING';
  }
  if (typeof value === 'number') return 'FLOAT';
  if (typeof value === 'boolean') return 'BOOLEAN';
  return 'STRING';
}

function convertToFigmaValue(value: any, type: VariableResolvedDataType): VariableValue {
  if (type === 'COLOR') {
    // Basic HEX parser
    if (typeof value === 'string' && value.startsWith('#')) {
      const hex = value.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;
      return { r, g, b, a: 1 };
    }
  }
  return value;
}

// === Message handling ===

figma.ui.onmessage = async (msg: { type: string; payload?: unknown; width?: number; height?: number }) => {
  switch (msg.type) {
    case 'ui-ready': {
      const data = await readVariables();
      figma.ui.postMessage({ type: 'variables-loaded', payload: data });
      break;
    }

    case 'resize-window': {
      if (msg.width && msg.height) {
        figma.ui.resize(msg.width, msg.height);
      }
      break;
    }

    case 'import-variables': {
      if (msg.payload) {
        await importVariables(msg.payload as any);
      }
      break;
    }

    case 'close':
      figma.closePlugin();
      break;

    default:
      console.log('Unknown message type:', msg.type);
  }
};
