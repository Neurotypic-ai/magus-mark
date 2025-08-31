export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  border: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
}

export interface Theme {
  name: string;
  colors: ThemeColors;
  style: {
    bg: string;
    fg: string;
    border: { fg: string };
    focus: { border: { fg: string } };
    selected: { bg: string; fg: string };
  };
}

export const matrixTheme: Theme = {
  name: 'matrix',
  colors: {
    primary: 'green',
    secondary: 'cyan',
    background: 'black',
    text: 'green',
    border: 'green',
    accent: 'white',
    success: 'green',
    warning: 'yellow',
    error: 'red',
  },
  style: {
    bg: 'black',
    fg: 'green',
    border: { fg: 'green' },
    focus: { border: { fg: 'cyan' } },
    selected: { bg: 'green', fg: 'black' },
  },
};

export const cyberpunkTheme: Theme = {
  name: 'cyberpunk',
  colors: {
    primary: 'magenta',
    secondary: 'yellow',
    background: 'black',
    text: 'magenta',
    border: 'magenta',
    accent: 'yellow',
    success: 'cyan',
    warning: 'yellow',
    error: 'red',
  },
  style: {
    bg: 'black',
    fg: 'magenta',
    border: { fg: 'magenta' },
    focus: { border: { fg: 'yellow' } },
    selected: { bg: 'magenta', fg: 'black' },
  },
};

export const hackerTheme: Theme = {
  name: 'hacker',
  colors: {
    primary: 'cyan',
    secondary: 'blue',
    background: 'black',
    text: 'cyan',
    border: 'cyan',
    accent: 'white',
    success: 'green',
    warning: 'yellow',
    error: 'red',
  },
  style: {
    bg: 'black',
    fg: 'cyan',
    border: { fg: 'cyan' },
    focus: { border: { fg: 'red' } },
    selected: { bg: 'cyan', fg: 'black' },
  },
};

export const minimalTheme: Theme = {
  name: 'minimal',
  colors: {
    primary: 'white',
    secondary: 'gray',
    background: 'black',
    text: 'white',
    border: 'gray',
    accent: 'blue',
    success: 'green',
    warning: 'yellow',
    error: 'red',
  },
  style: {
    bg: 'black',
    fg: 'white',
    border: { fg: 'gray' },
    focus: { border: { fg: 'blue' } },
    selected: { bg: 'white', fg: 'black' },
  },
};

export const themes: Record<string, Theme> = {
  matrix: matrixTheme,
  cyberpunk: cyberpunkTheme,
  hacker: hackerTheme,
  minimal: minimalTheme,
};

export function getTheme(name: string): Theme {
  return themes[name] ?? matrixTheme;
}
