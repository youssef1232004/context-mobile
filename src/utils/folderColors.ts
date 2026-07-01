export const FOLDER_COLORS = [
  { key: 'yellow',     hex: '#F5C518', label: 'Yellow'     },
  { key: 'red',        hex: '#E84040', label: 'Red'        },
  { key: 'orange',     hex: '#F08030', label: 'Orange'     },
  { key: 'green',      hex: '#3DAA6A', label: 'Green'      },
  { key: 'teal',       hex: '#1AAFA0', label: 'Teal'       },
  { key: 'blue',       hex: '#3B82F6', label: 'Blue'       },
  { key: 'purple',     hex: '#7C3AED', label: 'Purple'     },
  { key: 'magenta',    hex: '#EC4899', label: 'Magenta'    },
  { key: 'grey',       hex: '#8E8E8E', label: 'Grey'       },
  { key: 'pink',       hex: '#F4A7B9', label: 'Pink'       },
  { key: 'peach',      hex: '#F5C4A1', label: 'Peach'      },
  { key: 'mint',       hex: '#6DCFAA', label: 'Mint'       },
  { key: 'cyan',       hex: '#4ECDC4', label: 'Cyan'       },
  { key: 'periwinkle', hex: '#93C5FD', label: 'Periwinkle' },
  { key: 'lavender',   hex: '#C4B5FD', label: 'Lavender'   },
  { key: 'rose',       hex: '#FDA4AF', label: 'Rose'       },
] as const;

export type FolderColorKey = typeof FOLDER_COLORS[number]['key'];

export const getFolderColorHex = (key: string): string =>
  FOLDER_COLORS.find(c => c.key === key)?.hex ?? '#F5C518';
