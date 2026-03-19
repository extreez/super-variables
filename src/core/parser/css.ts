import { ImportToken, ImportSettings } from '../types';

export function parseCSS(content: string, settings: ImportSettings): ImportToken[] {
  const tokens: ImportToken[] = [];
  
  // 1. Try to parse header config
  let config: any = null;
  const configMatch = content.match(/\/\* --- SUPER_VARIABLES_CONFIG: (.*?) --- \*\//);
  if (configMatch) {
    try {
      config = JSON.parse(configMatch[1]);
    } catch (e) {
      console.warn("Failed to parse SUPER_VARIABLES_CONFIG");
    }
  }

  const effectiveDivider = config?.groupDivider || settings.groupDivider || '--';

  // State
  let currentCollection = settings.targetCollectionId || 'Imported';
  let currentMode = settings.targetModeId || 'default';
  
  // Clean comments but keep our specific mode markers
  const lines = content.split('\n');
  
  // Track selector context
  let inSelector = false;
  let currentSelector = '';

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Check for inline collection/mode comments
    const modeMatch = line.match(/\/\* --- Collection: (.*?), Mode: (.*?) --- \*\//);
    if (modeMatch) {
      currentCollection = modeMatch[1].trim();
      currentMode = modeMatch[2].trim();
      continue;
    }

    // Heuristic: Check for common theme comments
    // Example: /* Тема: Dark */ or /* Mode: Light (Default) */
    const genericThemeMatch = line.match(/\/\*\s*(?:Тема|Theme|Mode|Коллекция|Collection)\s*:\s*([^(*]+?)(?:\s*\(.*?\))?\s*\*\//i);
    if (genericThemeMatch) {
      const value = genericThemeMatch[1].trim();
      if (line.toLowerCase().includes('collection') || line.toLowerCase().includes('коллекция')) {
        currentCollection = value;
      } else {
        currentMode = value;
      }
      continue;
    }

    // Enter selector
    if (line.includes('{')) {
      inSelector = true;
      currentSelector = line.split('{')[0].trim();
      
      // Detection of mode from selector
      if (currentSelector === ':root') {
        // Keep current mode or set to default if not set by comment
        if (currentMode === 'default' || !currentMode) currentMode = 'Light'; 
      } else if (currentSelector.startsWith('.')) {
        // Class selector: .theme-dark -> theme-dark
        currentMode = currentSelector.replace('.', '');
      } else if (currentSelector.startsWith('[') && currentSelector.includes('=')) {
        // Attribute selector: [data-theme="dark"] -> dark
        const attrMatch = currentSelector.match(/=["']?([^\]"']+)["']?\]/);
        if (attrMatch) {
          currentMode = attrMatch[1];
        }
      }
      continue;
    }

    // Exit selector
    if (line.includes('}')) {
      inSelector = false;
      continue;
    }

    // Parse CSS variable
    if (inSelector && line.startsWith('--')) {
      const match = line.match(/--([^:]+):\s*([^;]+);?(.*)/);
      if (match) {
        const rawName = match[1].trim();
        let value = match[2].trim();
        const commentPart = match[3].trim();
        
        let customId: string | undefined = undefined;

        // Try to extract metadata from comment part or within the value line
        const fullLineCommentMatch = line.match(/\/\*\s*(.*?)\s*\*\//);
        if (fullLineCommentMatch) {
          const commentContent = fullLineCommentMatch[1];
          const idMatch = commentContent.match(/id:\s*([^\s,]+)/);
          const customIdMatch = commentContent.match(/customId:\s*([^\s,]+)/);
          
          if (customIdMatch) {
            customId = customIdMatch[1];
          } else if (idMatch) {
            // Fallback to id if customId not present, but usually we want customId for sync
            customId = idMatch[1];
          }
        }

        // Reverse formatting based on divider
        // Rule: --color--brand-500 -> color/brand/500
        let figmaName = rawName;
        if (effectiveDivider !== '/') {
          // Replace double dash with slash
          const parts = rawName.split(effectiveDivider);
          const lastPart = parts.pop() || '';
          
          // If the last part has a single dash, it was likely the last slash
          // Example: brand-500 -> brand/500
          // But we must be careful not to break names like primary-button
          // The most reliable way is what the user said: last slash -> single dash
          // So we always replace the LAST single dash in the WHOLE name if it exists?
          // No, let's stick to the divider logic and handle the last part.
          
          if (parts.length > 0) {
            figmaName = parts.join('/') + '/' + lastPart.replace('-', '/');
          } else {
            // No double dashes, maybe it's just one slash that became a dash
            figmaName = lastPart.replace('-', '/');
          }
        }

        // Detect deletion marker
        const isDeleted = value.toLowerCase() === 'delete' || commentPart.toLowerCase().includes('@delete');
        
        // If it's deleted, we still need the name for the deletion list
        // and we can skip other processing if it's a direct 'delete' value
        
        // Robust alias detection: var(  --name  )
        const aliasMatch = value.match(/var\s*\(\s*--([^)]+)\s*\)/);
        const isAlias = !!aliasMatch && !isDeleted;
        let finalValue = value;
        
        if (isAlias && aliasMatch) {
          const aliasRawName = aliasMatch[1].trim();
          // Apply same restoration logic to alias target
          const aliasParts = aliasRawName.split(effectiveDivider);
          const aliasLastPart = aliasParts.pop() || '';
          if (aliasParts.length > 0) {
            finalValue = aliasParts.join('/') + '/' + aliasLastPart.replace('-', '/');
          } else {
            finalValue = aliasLastPart.replace('-', '/');
          }
        }

        // Clean value if any trailing comment was somehow left
        finalValue = finalValue.split('/*')[0].trim();

        tokens.push({
          name: figmaName,
          value: isDeleted ? 'delete' : finalValue,
          customId: customId,
          collection: currentCollection,
          mode: currentMode,
          isAlias,
          isDeleted
        });
      }
    }
  }

  return tokens;
}
