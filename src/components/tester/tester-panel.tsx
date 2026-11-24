"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FlaskConical, Search } from "lucide-react";
import { jumpToStage } from "@/app/app/test-panel/actions";
import { switchTeam } from "@/app/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MenuSelect } from "@/components/ui/menu-select";
import { Modal } from "@/components/ui/modal";
import { ModuleHeader } from "@/components/ui/module-header";
import { EmptyNote } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { TESTER_COMPLETE_KEY } from "@/lib/tester";
import { useT } from "@/i18n/client";

export type TesterStartup = {
  id: string;
  name: string;
  status: "active" | "paused" | "archived";
  memberCount: number;
  isMember: boolean;
  /** Bieżący etap; null, gdy program jest domknięty w całości. */
  currentKey: string | null;
  allDone: boolean;
  /** Klucze etapów, które mają instancję (rozpoczęte albo domknięte). */
  started: string[];
};

type Stage = { key: string; title: string };

export function TesterPanel({
  stages,
  startups,
  loadFailed,
}: {
  stages: Stage[];
  startups: TesterStartup[];
  loadFailed: boolean;
}) {
  const t = useT("tester");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return startups;
    return startups.filter((startup) => startup.name.toLocaleLowerCase().includes(needle));
  }, [query, startups]);

  return (
    <div className="flex flex-col gap-6">
      <ModuleHeader
        title={t("page.title")}
        subtitle={t("page.subtitle", { count: startups.length })}
      />

      <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
        <FlaskConical className="mt-0.5 size-4 shrink-0 text-[var(--text-subtle)]" />
        <div className="flex flex-col gap-1 text-[13.5px] leading-relaxed text-[var(--text-muted)]">
          <p>{t("page.howEarlier")}</p>
          <p>{t("page.howLater")}</p>
          <p>{t("page.howScore")}</p>
        </div>
      </div>

      {loadFailed ? (
        <EmptyNote>{t("page.loadFailed")}</EmptyNote>
      ) : startups.length === 0 ? (
        <EmptyNote>{t("page.noStartups")}</EmptyNote>
      ) : (
        <>
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--text-subtle)]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("page.searchPlaceholder")}
              aria-label={t("page.searchPlaceholder")}
              className="pl-10"
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyNote>{t("page.noMatch")}</EmptyNote>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {filtered.map((startup) => (
                <StartupRow key={startup.id} startup={startup} stages={stages} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function StartupRow({ startup, stages }: { startup: TesterStartup; stages: Stage[] }) {
  const t = useT("tester");
  const router = useRouter();
  const { toast } = useToast();
  const [target, setTarget] = useState(startup.allDone ? TESTER_COMPLETE_KEY : (startup.currentKey ?? ""));
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [opening, startOpening] = useTransition();

  const titleOf = (key: string | null) =>
    key === TESTER_COMPLETE_KEY
      ? t("stage.complete")
      : (stages.find((stage) => stage.key === key)?.title ?? key ?? "");

  const currentLabel = startup.allDone ? t("stage.complete") : titleOf(startup.currentKey);

  const options = [
    ...stages.map((stage) => ({ value: stage.key, label: stage.title })),
    { value: TESTER_COMPLETE_KEY, label: t("stage.complete") },
  ];

  // Które rozpoczęte etapy znikną przy cofnięciu — liczone z danych, nie zgadywane.
  const targetIndex =
    target === TESTER_COMPLETE_KEY ? stages.length : stages.findIndex((s) => s.key === target);
  const toRemove = stages
    .filter((stage, index) => index > targetIndex && startup.started.includes(stage.key))
    .map((stage) => stage.title);

  const unchanged =
    (startup.allDone && target === TESTER_COMPLETE_KEY) ||
    (!startup.allDone && target === startup.currentKey);

  const run = () =>
    startTransition(async () => {
      setError(null);
      const result = await jumpToStage(startup.id, target);
      setConfirming(false);
      if (result.error !== null) {
        setError(result.error);
        return;
      }
      toast({
        tone: "success",
        title: t("toast.jumpedTitle", { name: startup.name, stage: titleOf(target) }),
        description:
          result.removed > 0
            ? t("toast.jumpedRemoved", { count: result.removed })
            : t("toast.jumpedBody"),
      });
      router.refresh();
    });

  const submit = () => {
    if (toRemove.length > 0) setConfirming(true);
    else run();
  };

  const open = () =>
    startOpening(async () => {
      const result = await switchTeam(startup.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/app/stage");
    });

  return (
    <li className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3.5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1 basis-56">
          <p className="truncate text-[15px] font-medium text-white">{startup.name}</p>
          <p className="mt-0.5 text-[12.5px] text-[var(--text-subtle)]">
            {t("row.members", { count: startup.memberCount })}
            {startup.isMember ? ` · ${t("row.yourTeam")}` : ""}
            {startup.status !== "active" ? ` · ${t(`row.status.${startup.status}`)}` : ""}
          </p>
          <p className="mt-1 text-[13px] text-[var(--text-muted)]">
            {t("row.now")}{" "}
            <span className="font-medium text-white">{currentLabel}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <MenuSelect
            size="sm"
            value={target}
            onChange={(value) => {
              setTarget(value);
              setError(null);
            }}
            options={options}
            ariaLabel={t("row.stageSelect", { name: startup.name })}
            disabled={pending}
            className="w-52"
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={submit}
            loading={pending}
            disabled={unchanged || pending}
            title={unchanged ? t("row.unchangedHint") : undefined}
          >
            {t("row.jump")}
          </Button>
          {startup.isMember ? (
            <Button size="sm" variant="ghost" onClick={open} loading={opening}>
              {t("row.open")}
              <ArrowRight />
            </Button>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="mt-2 text-[12.5px] text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}

      {confirming ? (
        <Modal
          title={t("confirm.title", { stage: titleOf(target) })}
          description={t("confirm.body", { name: startup.name })}
          onClose={() => setConfirming(false)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirming(false)} disabled={pending}>
                {t("confirm.cancel")}
              </Button>
              <Button variant="danger" onClick={run} loading={pending}>
                {t("confirm.submit")}
              </Button>
            </>
          }
        >
          <ul className="flex list-disc flex-col gap-1 pl-5 text-[13.5px] text-[var(--text-muted)]">
            {toRemove.map((title) => (
              <li key={title}>{title}</li>
            ))}
          </ul>
        </Modal>
      ) : null}
    </li>
  );
}
