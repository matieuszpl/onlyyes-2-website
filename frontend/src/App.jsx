import {
  BrowserRouter,
  Routes,
  Route,
  useSearchParams,
} from "react-router-dom";
import { UserProvider } from "./contexts/UserContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { GlobalAudioProvider } from "./contexts/GlobalAudioContext";
import { RadioEventsProvider } from "./contexts/RadioEventsContext";
import { ToastProvider } from "./components/ToastContainer";
import ConnectionNotification from "./components/ConnectionNotification";
import LayoutManager from "./components/layout/LayoutManager";
import KioskLayout from "./components/layout/KioskLayout";
import AnimatedBackground from "./components/AnimatedBackground";
import SnowEffect from "./components/SnowEffect";
import CRTEffect from "./components/CRTEffect";
import HomePage from "./pages/HomePage";
import ChartsPage from "./pages/ChartsPage";
import WorstChartsPage from "./pages/WorstChartsPage";
import RequestsPage from "./pages/RequestsPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import SchedulePage from "./pages/SchedulePage";
import AdminPanel from "./pages/AdminPanel";
import LeaderboardPage from "./pages/LeaderboardPage";
import ChangelogPage from "./pages/ChangelogPage";

function AppContent() {
  const [searchParams] = useSearchParams();
  const isKiosk = searchParams.get("mode") === "kiosk";

  if (isKiosk) {
    return <KioskLayout />;
  }

  return (
    <LayoutManager>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/charts" element={<ChartsPage />} />
        <Route path="/worst-charts" element={<WorstChartsPage />} />
        <Route path="/requests" element={<RequestsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/changelog" element={<ChangelogPage />} />
      </Routes>
    </LayoutManager>
  );
}

function App() {
  return (
    <ThemeProvider>
      <RadioEventsProvider>
        <GlobalAudioProvider>
          <UserProvider>
            <ToastProvider>
              <BrowserRouter>
                <div className="relative min-h-screen w-full max-w-full overflow-x-hidden">
                  <SnowEffect />
                  <CRTEffect />
                  <div className="relative z-10 w-full max-w-full">
                    <AppContent />
                  </div>
                  <ConnectionNotification />
                </div>
              </BrowserRouter>
            </ToastProvider>
          </UserProvider>
        </GlobalAudioProvider>
      </RadioEventsProvider>
    </ThemeProvider>
  );
}

export default App;
