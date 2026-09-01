import { createTheme } from '@mui/material/styles';
import clayTokens from './tokens';

const { color, radius, shadow } = clayTokens;

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: color.primary,
      dark: color.primaryDark
    },
    secondary: {
      main: color.secondary
    },
    error: {
      main: '#e0577a'
    },
    warning: {
      main: '#e0a13b'
    },
    success: {
      main: '#3caa7d'
    },
    background: {
      default: color.background,
      paper: color.surface
    },
    text: {
      primary: color.textPrimary,
      secondary: color.textSecondary
    },
    divider: color.border
  },
  shape: {
    borderRadius: radius.md
  },
  typography: {
    fontFamily: "'Nunito', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h4: {
      fontWeight: 800
    },
    h5: {
      fontWeight: 800
    },
    h6: {
      fontWeight: 700
    }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: color.background
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none'
        },
        rounded: {
          borderRadius: radius.lg
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: radius.lg,
          backgroundColor: color.surface,
          border: 'none',
          boxShadow: shadow.raised
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 700,
          borderRadius: radius.sm,
          paddingTop: 8,
          paddingBottom: 8
        },
        contained: {
          boxShadow: shadow.raisedSm,
          '&:hover': {
            boxShadow: shadow.raisedSm
          },
          '&:active': {
            boxShadow: shadow.pressed
          }
        },
        outlined: {
          borderColor: color.border,
          '&:hover': {
            borderColor: color.primary,
            backgroundColor: color.primarySoft
          }
        }
      }
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: radius.sm
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: radius.sm,
          fontWeight: 700
        }
      }
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined'
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: radius.sm,
          backgroundColor: color.background,
          '& fieldset': {
            borderColor: color.border
          },
          '&:hover fieldset': {
            borderColor: color.primary
          }
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: radius.lg,
          boxShadow: shadow.float
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: color.surface,
          color: color.textPrimary
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: color.surface,
          border: 'none'
        }
      }
    }
  }
});

export default theme;
