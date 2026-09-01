import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { ErrorBoundary } from '../Common';
import './Layout.css';

function Layout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <ErrorBoundary>
      <div className="layout">
        <Navbar onMenuClick={() => setMobileNavOpen(true)} />
        <div className="layout-body">
          <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
          <main className="layout-content">
            <Outlet />
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default Layout;
