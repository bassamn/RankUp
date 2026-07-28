import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import Sidebar from "./components/Sidebar";
import TimezoneOnboarding from "./components/TimezoneOnboarding";
import Analytics from "./pages/Analytics";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Timer from "./pages/Timer";
import Todos from "./pages/Todos";
import Topics from "./pages/Topics";
import { friendlyError } from "./lib/format";

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [topics, setTopics] = useState([]);
  const [settings, setSettings] = useState(null);
  const [dateContext, setDateContext] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const notify = useCallback((message, type = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const onError = useCallback((error) => notify(friendlyError(error), "error"), [notify]);

  const refresh = useCallback(async (message) => {
    try {
      const settingValues = await window.rankup.getSettings();
      setSettings(settingValues);
      if (settingValues.timezone) {
        const [topicRows, context] = await Promise.all([
          window.rankup.listTopics(),
          window.rankup.getDateContext()
        ]);
        setTopics(topicRows);
        setDateContext(context);
      } else {
        setTopics([]);
        setDateContext(null);
      }
      setRefreshKey((value) => value + 1);
      if (message) notify(message);
    } catch (error) {
      onError(error);
    } finally {
      setLoading(false);
    }
  }, [notify, onError]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!loading && !settings?.timezone) {
    return (
      <>
        <TimezoneOnboarding
          detectedTimezone={settings?.detectedTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"}
          onComplete={() => refresh()}
          onError={onError}
        />
        {toast && <div className={`toast ${toast.type}`}><XCircle size={18} /><span>{toast.message}</span></div>}
      </>
    );
  }

  let content;
  if (loading) {
    content = <div className="loading-screen"><span className="brand-mark">R</span><p>Loading your workspace…</p></div>;
  } else {
    const common = { topics, dateContext, refreshKey, onError };
    if (page === "topics") content = <Topics {...common} onChanged={() => refresh("Topics updated")} />;
    else if (page === "timer") content = <Timer {...common} settings={settings} onLogged={() => refresh("Session saved to today")} />;
    else if (page === "todos") content = <Todos {...common} onChanged={() => setRefreshKey((value) => value + 1)} />;
    else if (page === "analytics") content = <Analytics {...common} />;
    else if (page === "settings") content = <Settings settings={settings} onError={onError} onSaved={() => refresh("Settings saved successfully")} />;
    else content = <Dashboard {...common} onNavigate={setPage} />;
  }

  return (
    <div className="app-shell">
      <Sidebar page={page} onNavigate={setPage} />
      <main className={`main-content ${page === "settings" ? "settings-main" : ""}`}>{content}</main>
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === "error" ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
