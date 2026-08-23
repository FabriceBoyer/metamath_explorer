import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useMetamathStore } from "@/store/metamath-store";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function Layout() {
  const phase = useMetamathStore((s) => s.phase);
  const load = useMetamathStore((s) => s.load);
  const location = useLocation();

  useEffect(() => {
    if (phase === "idle") load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The graph page sizes its canvas to exactly fill the viewport below the
  // header (h-[calc(100dvh-3.5rem)], see GraphPage.tsx) so panning/zooming
  // feels like a full-screen tool. A footer rendered after it would push
  // the document taller than the screen, defeating that and forcing an
  // extra scroll past the graph on short/mobile viewports — so it's
  // intentionally omitted on this route only.
  const isFullBleed = location.pathname.startsWith("/graph");

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      {!isFullBleed && <Footer />}
    </div>
  );
}
