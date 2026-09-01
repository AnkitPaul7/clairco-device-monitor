// Shared claymorphism design tokens. Keep the numeric values here in sync with the
// CSS custom properties defined in `src/index.css` — MUI components consume these
// directly via the theme, while plain CSS files consume the mirrored custom properties.
const clayTokens = {
  color: {
    background: '#eef1f8',
    surface: '#f5f7fc',
    surfaceRaised: '#fbfcfe',
    primary: '#0d9488',
    primaryDark: '#0f766e',
    primarySoft: '#d6f5f0',
    secondary: '#3b6fe0',
    secondarySoft: '#dfe8fd',
    textPrimary: '#33394d',
    textSecondary: '#6b7290',
    border: 'rgba(99, 111, 156, 0.16)'
  },
  radius: {
    lg: 24,
    md: 16,
    sm: 12
  },
  shadow: {
    raised: '8px 8px 18px rgba(163, 177, 198, 0.45), -8px -8px 18px rgba(255, 255, 255, 0.85)',
    raisedSm: '5px 5px 12px rgba(163, 177, 198, 0.4), -5px -5px 12px rgba(255, 255, 255, 0.85)',
    pressed:
      'inset 4px 4px 8px rgba(163, 177, 198, 0.4), inset -4px -4px 8px rgba(255, 255, 255, 0.85)',
    float: '0 12px 24px rgba(99, 111, 156, 0.18)'
  }
};

export default clayTokens;
