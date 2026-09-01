import { AppBar, Box, Chip, IconButton, Toolbar, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Menu, Wifi, WifiOff } from '@mui/icons-material';
import { useSocketContext } from '../../context/socket';

function Navbar({ onMenuClick }) {
  const { connected } = useSocketContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <AppBar position="sticky" elevation={0} className="topbar">
      <Toolbar>
        {isMobile ? (
          <IconButton
            edge="start"
            onClick={onMenuClick}
            aria-label="Open navigation"
            sx={{ mr: 1 }}
          >
            <Menu />
          </IconButton>
        ) : null}
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Clairco Device Monitor
        </Typography>
        <Box>
          <Chip
            icon={connected ? <Wifi /> : <WifiOff />}
            label={connected ? 'Live' : 'Offline'}
            color={connected ? 'success' : 'default'}
            variant="outlined"
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
