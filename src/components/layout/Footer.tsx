import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl">{t("home.footerNote")}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <a
            className="hover:text-foreground hover:underline"
            href="https://github.com/metamath/set.mm"
            target="_blank"
            rel="noreferrer"
          >
            set.mm on GitHub
          </a>
          <a
            className="hover:text-foreground hover:underline"
            href="https://us.metamath.org"
            target="_blank"
            rel="noreferrer"
          >
            us.metamath.org
          </a>
          <a
            className="hover:text-foreground hover:underline"
            href="https://github.com/google/metamath.js"
            target="_blank"
            rel="noreferrer"
          >
            google/metamath.js
          </a>
        </div>
      </div>
    </footer>
  );
}
