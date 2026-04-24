import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { DashboardPage } from '../pages/DashboardPage';
import { PersonnelPage } from '../pages/PersonnelPage';
import { ApparatusPage } from '../pages/ApparatusPage';
import { IncidentsPage } from '../pages/IncidentsPage';

import { IncidentDetailPage } from '../pages/IncidentDetailPage';
import { ShiftTicketPage } from '../pages/ShiftTicketPage';

// Layout wrapper to inject AppShell
function Layout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/dashboard',
    element: <Layout><DashboardPage /></Layout>,
  },
  {
    path: '/personnel',
    element: <Layout><PersonnelPage /></Layout>,
  },
  {
    path: '/apparatus',
    element: <Layout><ApparatusPage /></Layout>,
  },
  {
    path: '/incidents',
    element: <Layout><IncidentsPage /></Layout>,
  },
  {
    path: '/incidents/:id',
    element: <Layout><IncidentDetailPage /></Layout>,
  },
  {
    path: '/incidents/:incidentId/shift-ticket/:ticketId',
    element: <Layout><ShiftTicketPage /></Layout>,
  },
]);
