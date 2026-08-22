import { Suspense, lazy } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout/Layout";
import HomePage from "@/pages/HomePage";

const HowItWorksPage = lazy(() => import("@/pages/HowItWorksPage"));
const BrowsePage = lazy(() => import("@/pages/BrowsePage"));
const StatementPage = lazy(() => import("@/pages/StatementPage"));
const GraphPage = lazy(() => import("@/pages/GraphPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

// HashRouter (not BrowserRouter): this app is a static, backend-less
// bundle that must also work when hosted on GitHub Pages (no server-side
// rewrite for deep links) or opened straight from disk. Hash-based routes
// need no server configuration at all.
export default function App() {
  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={200}>
        <HashRouter>
          <Suspense fallback={null}>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="how-it-works" element={<HowItWorksPage />} />
                <Route path="browse" element={<BrowsePage />} />
                <Route path="browse/:label" element={<StatementPage />} />
                <Route path="graph" element={<GraphPage />} />
                <Route path="graph/:label" element={<GraphPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </Suspense>
        </HashRouter>
      </TooltipProvider>
    </ThemeProvider>
  );
}
