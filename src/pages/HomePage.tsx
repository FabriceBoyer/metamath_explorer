import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Network,
  GraduationCap,
  Laptop,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMetamathStore } from "@/store/metamath-store";

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <span className="font-mono text-2xl font-semibold text-primary sm:text-3xl">
        {value}
      </span>
      <span className="text-xs text-muted-foreground sm:text-sm">{label}</span>
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

export default function HomePage() {
  const { t } = useTranslation();
  const index = useMetamathStore((s) => s.index);

  const features = [
    {
      icon: BookOpen,
      title: t("home.featureBrowseTitle"),
      body: t("home.featureBrowseBody"),
    },
    {
      icon: Network,
      title: t("home.featureGraphTitle"),
      body: t("home.featureGraphBody"),
    },
    {
      icon: GraduationCap,
      title: t("home.featureLearnTitle"),
      body: t("home.featureLearnBody"),
    },
    {
      icon: Laptop,
      title: t("home.featureLocalTitle"),
      body: t("home.featureLocalBody"),
    },
  ];

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, var(--color-primary) 0%, transparent 35%), radial-gradient(circle at 80% 0%, var(--color-accent) 0%, transparent 40%)",
          }}
        />
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 py-20 text-center sm:py-28">
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="rounded-full border border-border bg-card px-3 py-1 font-mono text-xs text-muted-foreground"
          >
            set.mm · {t("nav.tagline")}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold tracking-tight sm:text-5xl"
          >
            {t("home.heroTitle")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-2xl text-balance text-muted-foreground sm:text-lg"
          >
            {t("home.heroSubtitle")}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <Button asChild size="lg">
              <Link to="/browse">
                {t("home.ctaExplore")} <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/how-it-works">{t("home.ctaLearn")}</Link>
            </Button>
          </motion.div>
        </div>

        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-6 px-4 pb-16 sm:grid-cols-4">
          <Stat
            value={index ? index.meta.theoremCount.toLocaleString() : "47 697"}
            label={t("home.statsTheorems")}
          />
          <Stat
            value={index ? index.meta.axiomCount.toLocaleString() : "1 563"}
            label={t("home.statsAxioms")}
          />
          <Stat
            value={index ? index.constants.length.toLocaleString() : "…"}
            label={t("home.statsSymbols")}
          />
          <Stat value="~50 MB" label={t("home.statsDatabase")} />
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-10 px-4 py-16 sm:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold">
            {t("home.sectionWhatTitle")}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {t("home.sectionWhatBody")}
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">{t("home.sectionWhyTitle")}</h2>
          <p className="mt-3 text-muted-foreground">
            {t("home.sectionWhyBody")}
          </p>
        </div>
      </section>

      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-center text-2xl font-semibold">
            {t("home.featuresTitle")}
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                variants={fadeUp}
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <f.icon className="size-5" />
                    </div>
                    <CardTitle>{f.title}</CardTitle>
                    <CardDescription>{f.body}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
