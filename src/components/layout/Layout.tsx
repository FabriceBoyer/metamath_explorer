import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useMetamathStore } from "@/store/metamath-store";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function Layout() {
  const phase = useMetamathStore((s) => s.phase);
  const load = useMetamathStore((s) => s.load);

  useEffect(() => {
    if (phase === "idle") load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
