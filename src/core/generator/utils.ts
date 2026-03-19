import { ColorValue, TokenValue, ColorFormat, UnitSystem, TokenData, ExportSettings } from '../types';

/**
 * Converts Figma RGBA color to various formats
 */
export function convertColor(color: ColorValue, format: ColorFormat): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = color.a;

  switch (format) {
    case 'hex': {
      const toHex = (c: number) => c.toString(16).padStart(2, '0');
      // If fully opaque, use 6-digit hex, else 8-digit
      if (a === 1) {
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      } else {
        const alphaHex = Math.round(a * 255).toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}${alphaHex}`;
      }
    }
    case 'rgb':
      return `rgb(${r}, ${g}, ${b})`;
    case 'rgba':
      return `rgba(${r}, ${g}, ${b}, ${parseFloat(a.toFixed(3))})`;
    case 'hsl': {
      const { h, s, l } = rgbToHsl(r, g, b);
      if (a === 1) {
        return `hsl(${h}, ${s}%, ${l}%)`;
      } else {
        return `hsla(${h}, ${s}%, ${l}%, ${parseFloat(a.toFixed(3))})`;
      }
    }
    default:
      return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
}

/**
 * Converts RGB to HSL
 */
function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Formats a Figma variable path into a platform-specific name
 * Rule: color/brand/500 -> --color--brand-500
 * (Groups joined by divider, token name joined by single dash)
 */
export function formatName(path: string, divider: string, prefix: string = '--'): string {
  const parts = path.split('/');
  if (parts.length === 1) return `${prefix}${parts[0]}`;
  
  const tokenName = parts.pop();
  const groupPath = parts.join(divider);
  
  return `${prefix}${groupPath}-${tokenName}`;
}

/**
 * Converts values based on unit system
 */
export function formatValue(
  value: TokenValue, 
  settings: ExportSettings, 
  tokens: TokenData[],
  prefix: string = '--',
  modeId?: string // Optional: used for deep alias resolution
): string | number | boolean {
  if (value.type === 'alias') {
    if (settings.aliasStrategy === 'reference') {
      const targetToken = tokens.find(t => t.id === value.id);
      const name = targetToken ? targetToken.name : value.name;
      const formattedName = formatName(name, settings.groupDivider, prefix);
      
      switch (settings.format) {
        case 'css': return `var(${formattedName})`;
        case 'scss': return formattedName.replace('--', '$');
        case 'less': return formattedName.replace('--', '@');
        case 'sass': return formattedName.replace('--', '$');
        default: return formattedName;
      }
    } else {
      // Resolve alias strategy: find the actual value
      const targetToken = tokens.find(t => t.id === value.id);
      if (targetToken && modeId) {
        const targetValue = targetToken.valuesByMode[modeId];
        if (targetValue) {
          // Recursive call to handle alias chains
          return formatValue(targetValue, settings, tokens, prefix, modeId);
        }
      }
      // Fallback if token or value not found
      return value.name; 
    }
  }

  if (value.type === 'color') {
    return convertColor(value, settings.colorFormat);
  }

  if (value.type === 'float') {
    if (settings.unitSystem === 'rem') {
      return `${parseFloat((value.value / settings.baseFontSize).toFixed(4))}rem`;
    }
    // For JSON, we might want just the number if it's px and format is not CSS-like
    if (settings.format === 'json') return value.value;
    return `${value.value}px`;
  }
  
  if (value.type === 'boolean') {
    return value.value; // Return actual boolean
  }

  if (value.type === 'string') {
    return value.value;
  }

  return String((value as any).value || "");
}
