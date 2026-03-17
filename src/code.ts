// Super Variables — Plugin Code (Figma Sandbox)
// Reads variables from Figma and sends structured data to UI.

import { CollectionData, TokenData, TokenValue, VariablesPayload, PluginConfig } from './core/types';

const CONFIG_KEY = 'super-variables-config';

// === Plugin Config Storage ===

async function savePluginConfig(config: PluginConfig) {
  figma.root.setPluginData(CONFIG_KEY, JSON.stringify(config));
}

async function loadPluginConfig(): Promise<PluginConfig> {
  const data = figma.root.getPluginData(CONFIG_KEY);
  return data ? JSON.parse(data) : {
    collectionOrder: [],
    groupOrder: {},
    tokenOrder: {}
  };
}

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
    ((change.properties as any).includes('name') ||
      (change.properties as any).includes('valuesByMode') ||
      (change.properties as any).includes('description') ||
      (change.properties as any).includes('hiddenFromPublishing'))
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
    libraryName: 'Local',
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
      libraryName: 'Local',
      scopes: [...v.scopes],
      description: v.description,
      hiddenFromPublishing: v.hiddenFromPublishing,
      codeSyntax: (v as any).codeSyntax, // Custom metadata
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

async function importVariables(payload: import('./core/types').ImportPayload) {
  const { tokens, scopes, changes, settings } = payload;
  const log: import('./core/types').ImportLog = {
    added: [],
    updated: [],
    deleted: [],
    renames: {},
    errors: []
  };

  try {
    const figmaCollections = await figma.variables.getLocalVariableCollectionsAsync();
    let figmaVariables = await figma.variables.getLocalVariablesAsync();

    // 1. Process Changes (Deletions & Renames)
    if (changes) {
      if (changes.deletions && Array.isArray(changes.deletions)) {
        for (const path of changes.deletions) {
          const varsToDelete = figmaVariables.filter(v => v.name === path || v.name.startsWith(path + '/'));
          for (const v of varsToDelete) {
            v.remove();
            log.deleted.push(v.name);
          }
        }
        figmaVariables = await figma.variables.getLocalVariablesAsync(); // refresh
      }

      if (changes.renames && typeof changes.renames === 'object') {
        for (const [oldPath, newPath] of Object.entries(changes.renames)) {
          const varsToRename = figmaVariables.filter(v => v.name === oldPath || v.name.startsWith(oldPath + '/'));
          for (const v of varsToRename) {
            const relativePath = v.name.substring(oldPath.length);
            const finalNewPath = `${newPath}${relativePath}`;
            v.name = finalNewPath;
            log.renames[v.name] = finalNewPath;
          }
        }
        figmaVariables = await figma.variables.getLocalVariablesAsync(); // refresh
      }
    }

    // Helper to get or create collection
    const getOrCreateCollection = (name: string) => {
      let col = figmaCollections.find(c => c.name === name);
      if (!col) {
        col = figma.variables.createVariableCollection(name);
        figmaCollections.push(col);
      }
      return col;
    };

    // Helper to get or create mode
    const getOrCreateMode = (collection: VariableCollection, modeName: string) => {
      let mode = collection.modes.find(m => m.name === modeName || m.name.toLowerCase() === modeName.toLowerCase());
      if (!mode) {
        // If collection only has "Mode 1", rename it instead of creating if it's the first import
        if (collection.modes.length === 1 && collection.modes[0].name === 'Mode 1') {
          collection.renameMode(collection.modes[0].modeId, modeName);
          mode = collection.modes[0];
        } else {
          try {
            const newModeId = collection.addMode(modeName);
            mode = collection.modes.find(m => m.modeId === newModeId);
          } catch (e) {
            console.error(`Failed to add mode ${modeName}`, e);
          }
        }
      }
      return mode;
    };

    // 2. Process Tokens
    if (tokens && tokens.length > 0) {
      // Group tokens by Collection + Name to avoid duplicate creation
      const tokenGroups: Record<string, {
        name: string,
        collection: string,
        type: VariableResolvedDataType,
        isAlias: boolean,
        values: Record<string, any>, // modeName -> value
        aliasModes: Set<string> // track which modes are aliases
      }> = {};

      for (const t of tokens) {
        const colName = t.collection || settings.targetCollectionId || 'Imported';
        const key = `${colName}||${t.name}`;
        
        if (!tokenGroups[key]) {
          tokenGroups[key] = {
            name: t.name,
            collection: colName,
            type: 'STRING', // Default, will refine below
            isAlias: false,
            values: {},
            aliasModes: new Set()
          };
        }
        
        tokenGroups[key].values[t.mode || settings.targetModeId || 'default'] = t.value;
        
        if (t.isAlias) {
          tokenGroups[key].isAlias = true;
          tokenGroups[key].aliasModes.add(t.mode || settings.targetModeId || 'default');
        } else {
          // If we have at least one concrete value, use its type
          tokenGroups[key].type = getVariableType(t.value);
        }
      }

      // Pass 1: Create/Update Variables and set concrete values
      for (const key of Object.keys(tokenGroups)) {
        const group = tokenGroups[key];
        const collection = getOrCreateCollection(group.collection);
        
        // Refine type for alias-only variables
        if (group.aliasModes.size === Object.keys(group.values).length) {
          // All modes are aliases. Try to find the first target to get the type
          const firstAliasValue = Object.values(group.values)[0];
          const target = figmaVariables.find(v => v.name === firstAliasValue);
          if (target) group.type = target.resolvedType;
        }

        let variable = figmaVariables.find(v => v.name === group.name && v.variableCollectionId === collection.id);

        if (variable) {
          if (variable.resolvedType !== group.type) {
            try {
              variable.remove();
              figmaVariables = figmaVariables.filter(v => v.id !== variable!.id);
              variable = figma.variables.createVariable(group.name, collection, group.type);
              figmaVariables.push(variable);
              log.updated.push(`${group.name} (Recreated)`);
            } catch (e) {
              log.errors.push(`Failed to recreate ${group.name}`);
              continue;
            }
          } else {
            if (!log.updated.includes(group.name)) log.updated.push(group.name);
          }
        } else {
          variable = figma.variables.createVariable(group.name, collection, group.type);
          figmaVariables.push(variable);
          log.added.push(group.name);
        }

        // Set concrete values
        for (const [modeName, value] of Object.entries(group.values)) {
          if (group.aliasModes.has(modeName)) continue; // Skip aliases in Pass 1

          const mode = getOrCreateMode(collection, modeName);
          if (!mode) continue;

          try {
            const figmaValue = convertToFigmaValue(value, group.type, settings.baseFontSize);
            variable.setValueForMode(mode.modeId, figmaValue);
          } catch (e: any) {
            log.errors.push(`Value error ${group.name} [${modeName}]: ${e.message}`);
          }
        }
      }

      // Pass 2: Alias Resolution
      figmaVariables = await figma.variables.getLocalVariablesAsync(); // REFRESH!
      
      for (const key of Object.keys(tokenGroups)) {
        const group = tokenGroups[key];
        if (!group.isAlias) continue;

        const collection = getOrCreateCollection(group.collection);
        const variable = figmaVariables.find(v => v.name === group.name && v.variableCollectionId === collection.id);
        if (!variable) continue;

        for (const modeName of group.aliasModes) {
          const value = group.values[modeName];
          const mode = getOrCreateMode(collection, modeName);
          if (!mode) continue;

          // Value is already the path (e.g. "color/brand/500")
          const target = figmaVariables.find(v => v.name === value);
          
          if (target) {
            try {
              variable.setValueForMode(mode.modeId, { type: 'VARIABLE_ALIAS', id: target.id });
            } catch (e: any) {
              log.errors.push(`Link error ${group.name} -> ${value}: ${e.message}`);
            }
          } else {
            log.errors.push(`Alias target not found: ${value}`);
          }
        }
      }
    }

    // 3. Process Scopes
    if (scopes && typeof scopes === 'object') {
       for (const [path, scopeArray] of Object.entries(scopes)) {
          const variable = figmaVariables.find(v => v.name === path);
          if (variable && Array.isArray(scopeArray)) {
             try {
               variable.scopes = scopeArray as VariableScope[];
               if (!log.updated.includes(path)) log.updated.push(`${path} (Scopes updated)`);
             } catch (e) {
               log.errors.push(`Failed to set scopes for ${path}`);
             }
          }
       }
    }

    figma.ui.postMessage({ type: 'import-complete', log });
    figma.notify(`Imported: ${log.added.length} added, ${log.updated.length} updated.`, { timeout: 3000 });

    // Refresh data in UI
    const updatedData = await readVariables();
    figma.ui.postMessage({ type: 'variables-loaded', payload: updatedData });

  } catch (error: any) {
    figma.notify('Fatal Import Error: ' + error.message, { error: true });
    log.errors.push(error.message);
    figma.ui.postMessage({ type: 'import-complete', log });
  }
}

function getVariableType(value: any): VariableResolvedDataType {
  if (typeof value === 'string') {
    if (value.startsWith('#') || value.startsWith('rgba') || value.startsWith('rgb') || value.startsWith('hsl')) return 'COLOR';
    if (value.endsWith('px') || value.endsWith('rem')) return 'FLOAT';
    return 'STRING';
  }
  if (typeof value === 'number') return 'FLOAT';
  if (typeof value === 'boolean') return 'BOOLEAN';
  return 'STRING';
}

function convertToFigmaValue(value: any, type: VariableResolvedDataType, baseFontSize: number = 16): VariableValue {
  if (type === 'COLOR') {
    if (typeof value === 'string') {
      const str = value.trim();

      // Parse HEX
      if (str.startsWith('#')) {
        const hex = str.replace('#', '');
        if (hex.length === 6 || hex.length === 8) {
          return {
            r: parseInt(hex.substring(0, 2), 16) / 255,
            g: parseInt(hex.substring(2, 4), 16) / 255,
            b: parseInt(hex.substring(4, 6), 16) / 255,
            a: hex.length === 8 ? parseInt(hex.substring(6, 8), 16) / 255 : 1
          };
        }
      }

      // Parse rgb/rgba format
      const rgbaMatch = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (rgbaMatch) {
        return {
          r: parseInt(rgbaMatch[1]) / 255,
          g: parseInt(rgbaMatch[2]) / 255,
          b: parseInt(rgbaMatch[3]) / 255,
          a: rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1
        };
      }
      
      // Parse HSL (naive fallback approximation, proper HSL to RGB is complex without a lib, 
      // but let's assume standard hex/rgba is mostly used. If needed, a full hsl2rgb converter is required).
      // For now, if it's HSL, we might fail unless parsed properly.
    }

    // If it's already an object (e.g. from UI)
    if (typeof value === 'object' && value !== null && 'r' in value) {
      return value;
    }
  }

  if (type === 'FLOAT') {
    if (typeof value === 'string') {
      if (value.endsWith('rem')) {
        return parseFloat(value) * baseFontSize;
      }
      return parseFloat(value) || 0;
    }
    return Number(value) || 0;
  }
  
  if (type === 'BOOLEAN') return value === 'true' || value === true;

  return String(value);
}

// === Message handling ===

figma.ui.onmessage = async (msg: { type: string; payload?: any; width?: number; height?: number }) => {
  switch (msg.type) {
    case 'ui-ready': {
      const data = await readVariables();
      const config = await loadPluginConfig();
      figma.ui.postMessage({ type: 'variables-loaded', payload: data });
      figma.ui.postMessage({ type: 'config-loaded', config });
      break;
    }

    case 'resize-window': {
      if (msg.width && msg.height) {
        figma.ui.resize(msg.width, msg.height);
      }
      break;
    }

    case 'rename-collection': {
      const { collectionId, newName } = msg as any;
      const collection = await figma.variables.getVariableCollectionByIdAsync(collectionId);
      if (collection) {
        collection.name = newName;
        const data = await readVariables();
        figma.ui.postMessage({ type: 'variables-loaded', payload: data });
      }
      break;
    }

    case 'delete-collection': {
      const { collectionId } = msg as any;
      const collection = await figma.variables.getVariableCollectionByIdAsync(collectionId);
      if (collection) {
        try {
          collection.remove();
          const data = await readVariables();
          figma.ui.postMessage({ type: 'variables-loaded', payload: data });
        } catch (e) {
          figma.notify('Failed to delete collection: ' + (e as any).message, { error: true });
        }
      }
      break;
    }

    case 'rename-group': {
      const { collectionId, oldFullName, newName } = msg as any;
      const variables = await figma.variables.getLocalVariablesAsync();
      const groupVariables = variables.filter(v => v.variableCollectionId === collectionId && v.name.startsWith(oldFullName + '/'));

      for (const v of groupVariables) {
        v.name = v.name.replace(oldFullName + '/', newName + '/');
      }

      const data = await readVariables();
      figma.ui.postMessage({ type: 'variables-loaded', payload: data });
      break;
    }

    case 'duplicate-group': {
      const { collectionId, fullName } = msg as any;
      const variables = await figma.variables.getLocalVariablesAsync();
      const groupVariables = variables.filter(v => v.variableCollectionId === collectionId && v.name.startsWith(fullName + '/'));

      for (const v of groupVariables) {
        const newName = v.name.replace(fullName + '/', fullName + ' (Copy)/');
        const newVar = figma.variables.createVariable(newName, collectionId, v.resolvedType);
        for (const [modeId, val] of Object.entries(v.valuesByMode)) {
          newVar.setValueForMode(modeId, val);
        }
      }

      const data = await readVariables();
      figma.ui.postMessage({ type: 'variables-loaded', payload: data });
      break;
    }

    case 'delete-group': {
      const { collectionId, fullName } = msg as any;
      const variables = await figma.variables.getLocalVariablesAsync();
      const groupVariables = variables.filter(v => v.variableCollectionId === collectionId && v.name.startsWith(fullName + '/'));

      for (const v of groupVariables) {
        v.remove();
      }

      const data = await readVariables();
      figma.ui.postMessage({ type: 'variables-loaded', payload: data });
      break;
    }

    case 'ungroup-group': {
      const { collectionId, fullName } = msg as any;
      const variables = await figma.variables.getLocalVariablesAsync();
      const groupVariables = variables.filter(v => v.variableCollectionId === collectionId && v.name.startsWith(fullName + '/'));

      // fullName usually is "Primitive/Blue"
      // If we ungroup Blue, we want to move variables to "Primitive/"
      const lastSlashIdx = fullName.lastIndexOf('/');
      const parentName = lastSlashIdx !== -1 ? fullName.substring(0, lastSlashIdx + 1) : '';

      for (const v of groupVariables) {
        v.name = v.name.replace(fullName + '/', parentName);
      }

      const data = await readVariables();
      figma.ui.postMessage({ type: 'variables-loaded', payload: data });
      break;
    }


    case 'import-variables': {
      if (msg.payload) {
        await importVariables(msg.payload as any);
      }
      break;
    }

    case 'rename-mode': {
      const { collectionId, modeId, newName } = msg as any;
      const collection = await figma.variables.getVariableCollectionByIdAsync(collectionId);
      if (collection) {
        collection.renameMode(modeId, newName);
        const data = await readVariables();
        figma.ui.postMessage({ type: 'variables-loaded', payload: data });
      }
      break;
    }

    case 'create-mode': {
      const { collectionId } = msg as any;
      const collection = await figma.variables.getVariableCollectionByIdAsync(collectionId);
      if (collection) {
        try {
          const firstModeId = collection.modes[0].modeId;
          const newModeId = collection.addMode(`Mode ${collection.modes.length + 1}`);

          // Copy values from the first mode to the new mode
          const variables = await figma.variables.getLocalVariablesAsync();
          for (const variable of variables) {
            if (variable.variableCollectionId === collectionId) {
              const firstValue = variable.valuesByMode[firstModeId];
              if (firstValue !== undefined) {
                variable.setValueForMode(newModeId, firstValue);
              }
            }
          }

          const data = await readVariables();
          figma.ui.postMessage({ type: 'variables-loaded', payload: data });
        } catch (e) {
          figma.notify('Failed to add mode: ' + (e as any).message, { error: true });
        }
      }
      break;
    }

    case 'reorder-modes': {
      const { collectionId, modeIds } = msg as any;
      // Figma doesn't have a direct "reorder modes" API, but we can't easily move them.
      // However, we can at least refresh the UI. 
      // Actually, Figma modes are ordered as they are in the modes array.
      // Reordering usually requires deleting and recreating or complex workarounds.
      // For now, we notify that it's a display-only mock or partial support.
      figma.notify('Mode reordering is limited by Figma API', { timeout: 2000 });
      break;
    }

    case 'duplicate-mode': {
      const { collectionId, modeId } = msg as any;
      const collection = await figma.variables.getVariableCollectionByIdAsync(collectionId);
      if (collection) {
        try {
          const sourceMode = collection.modes.find(m => m.modeId === modeId);
          if (sourceMode) {
            const newModeId = collection.addMode(`${sourceMode.name} (Copy)`);
            const variables = await figma.variables.getLocalVariablesAsync();
            for (const variable of variables) {
              if (variable.variableCollectionId === collectionId) {
                const sourceValue = variable.valuesByMode[modeId];
                if (sourceValue !== undefined) {
                  variable.setValueForMode(newModeId, sourceValue);
                }
              }
            }
            const data = await readVariables();
            figma.ui.postMessage({ type: 'variables-loaded', payload: data });
          }
        } catch (e) {
          figma.notify('Failed to duplicate: ' + (e as any).message, { error: true });
        }
      }
      break;
    }

    case 'create-collection': {
      try {
        let name = 'New Collection';
        let iterations = 1;
        const collections = await figma.variables.getLocalVariableCollectionsAsync();

        while (collections.some(c => c.name === (iterations === 1 ? name : `${name} ${iterations}`))) {
          iterations++;
        }

        const finalName = iterations === 1 ? name : `${name} ${iterations}`;
        figma.variables.createVariableCollection(finalName);

        const data = await readVariables();
        figma.ui.postMessage({ type: 'variables-loaded', payload: data });
        figma.ui.postMessage({ type: 'collection-created', name: finalName });
        figma.notify(`Created collection "${finalName}"`);
      } catch (e) {
        figma.notify('Failed to create collection: ' + (e as any).message, { error: true });
      }
      break;
    }

    case 'delete-mode': {
      const { collectionId, modeId } = msg as any;
      const collection = await figma.variables.getVariableCollectionByIdAsync(collectionId);
      if (collection) {
        try {
          collection.removeMode(modeId);
          const data = await readVariables();
          figma.ui.postMessage({ type: 'variables-loaded', payload: data });
        } catch (e) {
          figma.notify('Failed to delete: ' + (e as any).message, { error: true });
        }
      }
      break;
    }

    case 'update-variable': {
      const { variableId, modeId, value } = msg as any;
      const variable = await figma.variables.getVariableByIdAsync(variableId);
      if (variable) {
        const type = variable.resolvedType;
        const figmaValue = convertToFigmaValue(value, type);
        try {
          variable.setValueForMode(modeId, figmaValue);
          const data = await readVariables();
          figma.ui.postMessage({ type: 'variables-loaded', payload: data });
        } catch (e) {
          figma.notify('Invalid value for ' + type.toLowerCase(), { error: true });
        }
      }
      break;
    }

    case 'move-group': {
      const { sourceFullNames, targetCollectionId, targetParentPath } = msg as any;
      try {
        const tokens = await figma.variables.getLocalVariablesAsync();
        const targetCollection = await figma.variables.getVariableCollectionByIdAsync(targetCollectionId);
        if (!targetCollection) throw new Error("Target collection not found");

        let moveCount = 0;

        for (const sourceFullName of sourceFullNames) {
          const tokensToMove = tokens.filter(t => {
            const name = t.name;
            return name === sourceFullName || name.startsWith(sourceFullName + '/');
          });

          for (const token of tokensToMove) {
            // Need to correctly preserve token structure. 
            // e.g. move 'Color/Brand' into 'Theme', 'Color/Brand/Primary' should become 'Theme/Brand/Primary'

            // The part of the token name *after* the sourceFullName
            let relativePath = '';
            if (token.name.startsWith(sourceFullName + '/')) {
              relativePath = token.name.substring(sourceFullName.length);
            }

            const sourceName = sourceFullName.split('/').pop() || sourceFullName;
            const newPath = targetParentPath
              ? `${targetParentPath}/${sourceName}${relativePath}`
              : `${sourceName}${relativePath}`;

            if (token.variableCollectionId === targetCollectionId) {
              // Internal move: Just rename
              if (token.name !== newPath) {
                token.name = newPath;
                moveCount++;
              }
            } else {
              // External move: Clone and Delete
              const newVar = figma.variables.createVariable(newPath, targetCollection, token.resolvedType);
              newVar.description = token.description;

              // Copy values and handle aliases
              const sourceCol = await figma.variables.getVariableCollectionByIdAsync(token.variableCollectionId);
              if (sourceCol) {
                for (const sourceMode of sourceCol.modes) {
                  const targetMode = targetCollection.modes.find(m => m.name === sourceMode.name) || targetCollection.modes[0];
                  if (targetMode) {
                    const val = token.valuesByMode[sourceMode.modeId];
                    try {
                      newVar.setValueForMode(targetMode.modeId, val);
                    } catch (err) {
                      console.error(`Failed to set value for mode ${targetMode.name}`, err);
                    }
                  }
                }
              }

              token.remove();
              moveCount++;
            }
          }
        }

        const data = await readVariables();
        figma.ui.postMessage({ type: 'variables-loaded', payload: data });
        figma.notify(`Successfully moved ${moveCount} variables`);
      } catch (e) {
        figma.notify('Move failed: ' + (e as any).message, { error: true });
      }
      break;
    }

    case 'merge-collections': {
      const { sourceCollectionId, targetCollectionId } = msg as any;
      try {
        const sourceCol = await figma.variables.getVariableCollectionByIdAsync(sourceCollectionId);
        const targetCol = await figma.variables.getVariableCollectionByIdAsync(targetCollectionId);

        if (sourceCol && targetCol) {
          const tokens = await figma.variables.getLocalVariablesAsync();
          const sourceTokens = tokens.filter(t => t.variableCollectionId === sourceCollectionId);

          // In Figma, moving between collections means creating NEW variables and deleting OLD ones
          // because variableCollectionId is read-only. This is a big operation.
          figma.notify('Merging collections requires copying variables (coming soon)', { error: false });
        }
      } catch (e) {
        figma.notify('Merge failed: ' + (e as any).message, { error: true });
      }
      break;
    }

    case 'update-variable-description': {
      const { variableId, description } = msg as any;
      const variable = await figma.variables.getVariableByIdAsync(variableId);
      if (variable) {
        variable.description = description;
        const data = await readVariables();
        figma.ui.postMessage({ type: 'variables-loaded', payload: data });
      }
      break;
    }

    case 'update-variable-name': {
      const { variableId, newName } = msg as any;
      const variable = await figma.variables.getVariableByIdAsync(variableId);
      if (variable) {
        variable.name = newName;
        const data = await readVariables();
        figma.ui.postMessage({ type: 'variables-loaded', payload: data });
      }
      break;
    }

    case 'update-variable-hidden': {
      const { variableId, hidden } = msg as any;
      const variable = await figma.variables.getVariableByIdAsync(variableId);
      if (variable) {
        variable.hiddenFromPublishing = hidden;
        const data = await readVariables();
        figma.ui.postMessage({ type: 'variables-loaded', payload: data });
      }
      break;
    }

    case 'update-variable-code-syntax': {
      const { variableId, codeSyntax } = msg as any;
      const variable = await figma.variables.getVariableByIdAsync(variableId);
      if (variable) {
        // Store as custom metadata (not native Figma API)
        (variable as any).codeSyntax = codeSyntax;
        const data = await readVariables();
        figma.ui.postMessage({ type: 'variables-loaded', payload: data });
      }
      break;
    }

    case 'update-variable-scopes': {
      const { variableIds, scopes } = msg as any;
      try {
        let updatedCount = 0;
        for (const variableId of variableIds) {
          const variable = await figma.variables.getVariableByIdAsync(variableId);
          if (variable) {
            variable.scopes = scopes;
            updatedCount++;
          }
        }
        const data = await readVariables();
        figma.ui.postMessage({ type: 'variables-loaded', payload: data });
        figma.notify(`Updated scopes for ${updatedCount} variable(s)`);
      } catch (e) {
        figma.notify('Failed to update scopes: ' + (e as any).message, { error: true });
      }
      break;
    }

    case 'duplicate-variables': {
      const { variableIds } = msg as any;
      try {
        let count = 0;
        for (const id of variableIds) {
          const original = await figma.variables.getVariableByIdAsync(id);
          if (original) {
            const collection = await figma.variables.getVariableCollectionByIdAsync(original.variableCollectionId);
            if (collection) {
              const copy = figma.variables.createVariable(
                original.name + " copy",
                collection,
                original.resolvedType
              );
              copy.description = original.description;
              copy.hiddenFromPublishing = original.hiddenFromPublishing;
              copy.scopes = original.scopes;
              // copy values
              for (const [modeId, value] of Object.entries(original.valuesByMode)) {
                copy.setValueForMode(modeId, value);
              }
              count++;
            }
          }
        }
        const data = await readVariables();
        figma.ui.postMessage({ type: 'variables-loaded', payload: data });
        figma.notify(`Successfully duplicated ${count} variable(s)`);
      } catch (e) {
        figma.notify('Duplication failed: ' + (e as any).message, { error: true });
      }
      break;
    }

    case 'delete-variables': {
      const { variableIds } = msg as any;
      try {
        let count = 0;
        for (const id of variableIds) {
          const variable = await figma.variables.getVariableByIdAsync(id);
          if (variable) {
            variable.remove();
            count++;
          }
        }
        const data = await readVariables();
        figma.ui.postMessage({ type: 'variables-loaded', payload: data });
        figma.notify(`Successfully deleted ${count} variable(s)`);
      } catch (e) {
        figma.notify('Deletion failed: ' + (e as any).message, { error: true });
      }
      break;
    }

    case 'create-group-from-selection': {
      const { variableIds, groupName } = msg as any;
      try {
        let count = 0;
        for (const id of variableIds) {
          const variable = await figma.variables.getVariableByIdAsync(id);
          if (variable) {
            const parts = variable.name.split('/');
            const leafName = parts.pop();
            const parentPath = parts.join('/');

            const newName = parentPath
              ? `${parentPath}/${groupName}/${leafName}`
              : `${groupName}/${leafName}`;

            variable.name = newName;
            count++;
          }
        }
        const data = await readVariables();
        figma.ui.postMessage({ type: 'variables-loaded', payload: data });
        figma.notify(`Moved ${count} variables to new group "${groupName}"`);
      } catch (e) {
        figma.notify('Grouping failed: ' + (e as any).message, { error: true });
      }
      break;
    }

    case 'move-variable': {
      const { variableId, targetVariableId, position } = msg as any;
      // position: 'before' | 'after'

      try {
        const variable = await figma.variables.getVariableByIdAsync(variableId);
        const target = await figma.variables.getVariableByIdAsync(targetVariableId);

        if (!variable || !target) {
          figma.notify('Variable not found', { error: true });
          break;
        }

        // Загружаем конфиг
        const config = await loadPluginConfig();

        // Helper для получения пути группы из имени переменной
        const getGroupPath = (name: string): string => {
          const parts = name.split('/');
          parts.pop(); // убираем имя токена
          return parts.join('/') || 'Root';
        };

        const varGroup = getGroupPath(variable.name);
        const targetGroup = getGroupPath(target.name);

        // Если перемещение между группами — обновляем имя переменной
        if (varGroup !== targetGroup) {
          const varName = variable.name.split('/').pop();
          const newName = targetGroup === 'Root'
            ? varName
            : `${targetGroup}/${varName}`;
          variable.name = newName;
        }

        // Обновляем порядок токенов в конфиге
        const varGroupOrder = config.tokenOrder[varGroup] || [];
        const targetGroupOrder = config.tokenOrder[targetGroup] || [];

        // Удаляем из старой позиции
        const varIdx = varGroupOrder.indexOf(variableId);
        if (varIdx !== -1) {
          varGroupOrder.splice(varIdx, 1);
        }

        // Вставляем в новую позицию
        const targetIdx = targetGroupOrder.indexOf(targetVariableId);
        const insertIdx = position === 'before' ? targetIdx : targetIdx + 1;
        const actualInsertIdx = insertIdx < 0 ? 0 : insertIdx;
        targetGroupOrder.splice(actualInsertIdx, 0, variableId);

        // Сохраняем обновлённый порядок
        config.tokenOrder[varGroup] = varGroupOrder.filter(id => id !== variableId);
        config.tokenOrder[targetGroup] = targetGroupOrder;

        await savePluginConfig(config);

        // Обновляем UI
        const data = await readVariables();
        figma.ui.postMessage({ type: 'variables-loaded', payload: data });
        figma.ui.postMessage({ type: 'config-saved', config });

      } catch (e) {
        figma.notify('Move failed: ' + (e as any).message, { error: true });
      }
      break;
    }

    case 'set-variable-alias': {
      const { variableId, modeId, targetTokenId, targetTokenName } = msg as any;
      const variable = await figma.variables.getVariableByIdAsync(variableId);
      if (variable) {
        try {
          variable.setValueForMode(modeId, { type: 'VARIABLE_ALIAS', id: targetTokenId });
          const data = await readVariables();
          figma.ui.postMessage({ type: 'variables-loaded', payload: data });
          figma.notify(`Linked to ${targetTokenName}`);
        } catch (e) {
          figma.notify('Failed to link: ' + (e as any).message, { error: true });
        }
      }
      break;
    }

    case 'remove-variable-alias': {
      const { variableId, modeId } = msg as any;
      const variable = await figma.variables.getVariableByIdAsync(variableId);
      if (variable) {
        try {
          const currentValue = variable.valuesByMode[modeId];
          const data = await readVariables();
          figma.ui.postMessage({ type: 'variables-loaded', payload: data });
          figma.notify('Alias removed');
        } catch (e) {
          figma.notify('Failed to unlink: ' + (e as any).message, { error: true });
        }
      }
      break;
    }

    case 'request-eyedropper': {
      figma.notify('Eyedropper coming soon', { timeout: 1500 });
      break;
    }

    case 'notify': {
      const { message, options } = msg as any;
      figma.notify(message, options);
      break;
    }

    case 'close':
      figma.closePlugin();
      break;

    default:
      console.log('Unknown message type:', msg.type);
  }
};
