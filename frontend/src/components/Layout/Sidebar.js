import { NavLink } from 'react-router-dom';
import { Box, Drawer, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Dashboard, Devices, History } from '@mui/icons-material';
import './Layout.css';

const navItems = [
  { to: '/', label: 'Dashboard', icon: <Dashboard />, end: true },
  { to: '/devices', label: 'Devices', icon: <Devices /> },
  { to: '/alerts', label: 'Alerts', icon: <History /> }
];

function SidebarNav({ onNavigate }) {
  return (
    <nav>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          onClick={onNavigate}
        >
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function Sidebar({ mobileOpen, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (isMobile) {
    return (
      <Drawer open={mobileOpen} onClose={onClose} ModalProps={{ keepMounted: true }}>
        <Box className="sidebar sidebar-mobile" role="presentation">
          <SidebarNav onNavigate={onClose} />
        </Box>
      </Drawer>
    );
  }

  return (
    <aside className="sidebar">
      <SidebarNav />
    </aside>
  );
}

export default Sidebar;
