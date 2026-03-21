import { createBrowserRouter } from 'react-router';
import { PublicLayout } from './components/layout/PublicLayout';
import { AppLayout } from './components/layout/AppLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { Home } from './pages/public/Home';
import { About } from './pages/public/About';
import { Privacy } from './pages/public/Privacy';
import { Contact } from './pages/public/Contact';
import { Login } from './pages/auth/Login';
import { EmailVerify } from './pages/auth/EmailVerify';
import { Dashboard } from './pages/app/Dashboard';
import { Profile } from './pages/app/Profile';
import { Questionnaire } from './pages/app/Questionnaire';
import { WeeklyParticipation } from './pages/app/WeeklyParticipation';
import { MatchRecords } from './pages/app/MatchRecords';
import { MatchDetail } from './pages/app/MatchDetail';
import { Settings } from './pages/app/Settings';
import { AdminOverview } from './pages/admin/AdminOverview';
import { UserManagement } from './pages/admin/UserManagement';
import { QuestionBank } from './pages/admin/QuestionBank';
import { MatchBatches } from './pages/admin/MatchBatches';
import { ContactConsult } from './pages/admin/ContactConsult';

export const router = createBrowserRouter([
  {
    Component: PublicLayout,
    children: [
      { path: '/', Component: Home },
      { path: '/about', Component: About },
      { path: '/privacy', Component: Privacy },
      { path: '/contact', Component: Contact },
    ],
  },
  { path: '/login', Component: Login },
  { path: '/verify', Component: EmailVerify },
  {
    path: '/app',
    Component: AppLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: 'dashboard', Component: Dashboard },
      { path: 'profile', Component: Profile },
      { path: 'questionnaire', Component: Questionnaire },
      { path: 'participation', Component: WeeklyParticipation },
      { path: 'matches', Component: MatchRecords },
      { path: 'matches/:id', Component: MatchDetail },
      { path: 'settings', Component: Settings },
    ],
  },
  {
    path: '/admin',
    Component: AdminLayout,
    children: [
      { index: true, Component: AdminOverview },
      { path: 'users', Component: UserManagement },
      { path: 'questions', Component: QuestionBank },
      { path: 'batches', Component: MatchBatches },
      { path: 'consult', Component: ContactConsult },
    ],
  },
]);
