import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Type,
  Ruler,
  Landmark,
  MessageSquareQuote,
  FileCheck2,
  GitFork,
  Box,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ToyProofStepper } from "@/components/metamath/ToyProofStepper";

const STEPS = [
  { icon: Type, titleKey: "step1Title", bodyKey: "step1Body" },
  { icon: Ruler, titleKey: "step2Title", bodyKey: "step2Body" },
  { icon: Landmark, titleKey: "step3Title", bodyKey: "step3Body" },
  { icon: MessageSquareQuote, titleKey: "step4Title", bodyKey: "step4Body" },
  { icon: FileCheck2, titleKey: "step5Title", bodyKey: "step5Body" },
  { icon: GitFork, titleKey: "step6Title", bodyKey: "step6Body" },
  { icon: Box, titleKey: "step7Title", bodyKey: "step7Body" },
];

export default function HowItWorksPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("howItWorks.title")}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          {t("howItWorks.subtitle")}
        </p>
      </header>

      <ol className="relative border-s border-border ps-6">
        {STEPS.map((step, i) => (
          <motion.li
            key={step.titleKey}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: i * 0.04 }}
            className="mb-8 last:mb-0"
          >
            <span className="absolute -start-[13px] flex size-6 items-center justify-center rounded-full border border-primary bg-background text-primary">
              <step.icon className="size-3.5" />
            </span>
            <h2 className="font-semibold">
              {t(`howItWorks.${step.titleKey}`)}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {t(`howItWorks.${step.bodyKey}`)}
            </p>
          </motion.li>
        ))}
      </ol>

      <Card className="mt-10 border-primary/30 bg-primary/5">
        <CardContent className="pt-5">
          <h2 className="font-semibold">{t("howItWorks.verifierTitle")}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {t("howItWorks.verifierBody")}
          </p>
        </CardContent>
      </Card>

      <section className="mt-14">
        <h2 className="text-xl font-semibold">{t("howItWorks.tryItTitle")}</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {t("howItWorks.tryItBody")}
        </p>
        <div className="mt-5">
          <ToyProofStepper />
        </div>
      </section>

      <div className="mt-14 flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/40 p-8 text-center">
        <h2 className="text-lg font-semibold">{t("howItWorks.goExplore")}</h2>
        <Button asChild size="lg">
          <Link to="/browse">
            {t("howItWorks.goExploreCta")} <ArrowRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}
