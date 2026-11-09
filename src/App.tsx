import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './auth/AuthContext';
import { RequireAdmin, RequireAuth, RequireEditor } from './auth/guards';
import { Layout } from './components/Layout';
import { AccountPage } from './pages/AccountPage';
import { GamePage } from './pages/GamePage';
import { GamesPage } from './pages/GamesPage';
import { LoginPage } from './pages/LoginPage';
import { NewGamePage } from './pages/NewGamePage';
import { PromotionPage } from './pages/PromotionPage';
import { PromotionsPage } from './pages/PromotionsPage';
import { UsersPage } from './pages/UsersPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route path="/games" element={<GamesPage />} />
            <Route
              path="/games/new"
              element={
                <RequireEditor>
                  <NewGamePage />
                </RequireEditor>
              }
            />
            <Route path="/games/:gameId" element={<GamePage />} />
            <Route path="/promotions" element={<PromotionsPage />} />
            <Route path="/promotions/:id" element={<PromotionPage />} />
            <Route
              path="/users"
              element={
                <RequireAdmin>
                  <UsersPage />
                </RequireAdmin>
              }
            />
            <Route path="/account" element={<AccountPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/games" replace />} />
        </Routes>
      </BrowserRouter>
      <ToastContainer position="bottom-right" theme="dark" autoClose={4000} newestOnTop />
    </AuthProvider>
  );
}
