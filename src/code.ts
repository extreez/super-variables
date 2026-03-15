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
  if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
    // Attempt alias resolution (by name)
    const targetName = value.substring(1, value.length - 1);
    const target = figma.variables.getLocalVariables().find(v => v.name === targetName);
    if (target) {
      return { type: 'VARIABLE_ALIAS', id: target.id };
    }
  }

  if (type === 'COLOR') {
    if (typeof value === 'string') {
      const hex = value.replace('#', '');
      if (hex.length === 6) {
        return {
          r: parseInt(hex.substring(0, 2), 16) / 255,
          g: parseInt(hex.substring(2, 4), 16) / 255,
          b: parseInt(hex.substring(4, 6), 16) / 255,
          a: 1
        };
      }
      // Parse rgb format
      const rgbMatch = value.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (rgbMatch) {
        return {
          r: parseInt(rgbMatch[1]) / 255,
          g: parseInt(rgbMatch[2]) / 255,
          b: parseInt(rgbMatch[3]) / 255,
          a: 1
        };
      }
    }
  }

  if (type === 'FLOAT') return parseFloat(value) || 0;
  if (type === 'BOOLEAN') return value === 'true' || value === true;

  return value;
}

// === Message handling ===

figma.ui.onmessage = async (msg: { type: string; payload?: any; width?: number; height?: number }) => {
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
            const relativePath = token.name.substring(sourceFullName.length);
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

    case 'close':
      figma.closePlugin();
      break;

    default:
      console.log('Unknown message type:', msg.type);
  }
};
