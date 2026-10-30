import type { ThemePalette } from '../../../types/theme';
import { paletteToCssVariables, getHighContrastVariables } from './oklchEngine';

/**
 * Apply theme CSS variables to the document root
 */
export function applyThemeVariables(palette: ThemePalette, isDark: boolean, highContrast: boolean = false): void {
  const root = document.documentElement;
  const variables = paletteToCssVariables(palette, isDark);

  // Apply base variables
  for (const [key, value] of Object.entries(variables)) {
    root.style.setProperty(key, value);
  }

  // Apply high contrast overrides if enabled
  if (highContrast) {
    const hcVars = getHighContrastVariables(isDark);
    for (const [key, value] of Object.entries(hcVars)) {
      root.style.setProperty(key, value);
    }
  }

  // Set theme attributes for CSS selectors
  root.setAttribute('data-theme', isDark ? 'dark' : 'light');
  if (highContrast) {
    root.setAttribute('data-contrast', 'high');
  } else {
    root.removeAttribute('data-contrast');
  }
}

/**
 * Generate complete CSS string for a theme (for export/preview)
 */
export function generateThemeCssString(palette: ThemePalette, isDark: boolean, highContrast: boolean = false): string {
  const variables = paletteToCssVariables(palette, isDark);
  const hcVars = highContrast ? getHighContrastVariables(isDark) : {};

  const allVars = { ...variables, ...hcVars };

  let css = `:root, [data-theme="${isDark ? 'dark' : 'light'}"] {\n`;
  for (const [key, value] of Object.entries(allVars)) {
    css += `  ${key}: ${value};\n`;
  }
  css += '}\n';

  if (highContrast) {
    css += `\n[data-theme="${isDark ? 'dark' : 'light'}"][data-contrast="high"] {\n`;
    for (const [key, value] of Object.entries(hcVars)) {
      css += `  ${key}: ${value};\n`;
    }
    css += '}\n';
  }

  return css;
}

/**
 * Transition theme smoothly
 */
export function transitionTheme(
  fromPalette: ThemePalette,
  toPalette: ThemePalette,
  isDark: boolean,
  duration: number = 300
): Promise<void> {
  return new Promise((resolve) => {
    const root = document.documentElement;
    const fromVars = paletteToCssVariables(fromPalette, isDark);
    const toVars = paletteToCssVariables(toPalette, isDark);

    // Set initial values
    for (const [key, value] of Object.entries(fromVars)) {
      root.style.setProperty(key, value);
    }

    // Force reflow
    root.offsetHeight;

    // Start transition
    root.style.transition = `background-color ${duration}ms ease, color ${duration}ms ease, border-color ${duration}ms ease`;

    // Apply target values
    for (const [key, value] of Object.entries(toVars)) {
      root.style.setProperty(key, value);
    }

    // Clean up transition after completion
    setTimeout(() => {
      root.style.transition = '';
      resolve();
    }, duration);
  });
}

/**
 * Create a style element with theme CSS (for SSR/preview)
 */
export function createThemeStyleElement(palette: ThemePalette, isDark: boolean, highContrast: boolean = false): HTMLStyleElement {
  const style = document.createElement('style');
  style.textContent = generateThemeCssString(palette, isDark, highContrast);
  style.setAttribute('data-theme-style', 'true');
  return style;
}

/**
 * Remove all generated theme style elements
 */
export function clearGeneratedThemeStyles(): void {
  document.querySelectorAll('style[data-theme-style="true"]').forEach(el => el.remove());
}

/**
 * Get current applied theme variables from DOM
 */
export function getCurrentThemeVariables(): Record<string, string> {
  const root = document.documentElement;
  const computed = getComputedStyle(root);
  const variables: Record<string, string> = {};

  // Get all CSS custom properties
  for (let i = 0; i < computed.length; i++) {
    const prop = computed[i];
    if (prop.startsWith('--')) {
      variables[prop] = computed.getPropertyValue(prop).trim();
    }
  }

  return variables;
}

/**
 * Check if current theme is dark
 */
export function isCurrentThemeDark(): boolean {
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

/**
 * Check if high contrast is enabled
 */
export function isHighContrastEnabled(): boolean {
  return document.documentElement.getAttribute('data-contrast') === 'high';
}