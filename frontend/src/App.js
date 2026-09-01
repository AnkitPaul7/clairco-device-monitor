import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AlertProvider } from './context/alert';
import { DeviceProvider } from './context/device';
import { SocketProvider } from './context/socket';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DeviceManagement from './pages/DeviceManagement';
import AlertHistory from './pages/AlertHistory';
import './App.css';

function App() {
  return (
    <SocketProvider>
      <DeviceProvider>
        <AlertProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/devices" element={<DeviceManagement />} />
                <Route path="/alerts" element={<AlertHistory />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AlertProvider>
      </DeviceProvider>
    </SocketProvider>
  );
}

export default App;
