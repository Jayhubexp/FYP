import { Theme } from '../types/app';

class ThemeService {
  private themes: Theme[] = [];

  initialize() {
    // Initialize with built-in themes
    this.themes = [];
  }

  getAllThemes(): Theme[] {
    return this.themes;
  }

  createTheme(themeData: Omit<Theme, 'id'>): Theme {
    const newTheme: Theme = {
      ...themeData,
      id: Date.now().toString()
    };
    
    this.themes.push(newTheme);
    return newTheme;
  }

  updateTheme(id: string, updates: Partial<Theme>): Theme | null {
    const index = this.themes.findIndex(theme => theme.id === id);
    if (index === -1) return null;

    this.themes[index] = {
      ...this.themes[index],
      ...updates
    };

    return this.themes[index];
  }

  deleteTheme(id: string): boolean {
    const index = this.themes.findIndex(theme => theme.id === id);
    if (index === -1) return false;

    this.themes.splice(index, 1);
    return true;
  }

  exportTheme(id: string): string | null {
    const theme = this.themes.find(t => t.id === id);
    if (!theme) return null;

    return JSON.stringify(theme, null, 2);
  }

  importTheme(themeJson: string): Theme | null {
    try {
      const themeData = JSON.parse(themeJson);
      const newTheme: Theme = {
        ...themeData,
        id: Date.now().toString()
      };
      
      this.themes.push(newTheme);
      return newTheme;
    } catch (error) {
      console.error('Failed to import theme:', error);
      return null;
    }
  }
}

export const themeService = new ThemeService();