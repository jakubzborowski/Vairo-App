import { cn } from "@/lib/utils";

/**
 * Karta = jeden poziom jasności wyżej niż tło, plus wyniesienie.
 *
 * Wcześniej było tu „bez cieni — na ciemnym i tak nie działają". To była
 * połowa prawdy: sam cień faktycznie nic nie daje, bo nie ma czego
 * przyciemnić. Działa dopiero cień W DÓŁ razem z jasnym włosem NA GÓRZE
 * krawędzi (`--lift-*`) — wtedy karta wygląda jak przedmiot leżący na tle,
 * a nie jak prostokąt w innym odcieniu.
 *
 * `interactive` dodaje reakcję na kursor dla kart, które są klikalne.
 */
export function Card({
  className,
  interactive,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.07] bg-[var(--surface)] lift-1",
        interactive && "lift-hover hover:border-white/15",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 px-5 pt-5 pb-3",
        className
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-[15px] font-semibold text-white", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("mt-0.5 text-[13px] text-[var(--text-subtle)]", className)}
      {...props}
    />
  );
}

export function CardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pb-5", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 border-t border-white/[0.06] px-5 py-3.5",
        className
      )}
      {...props}
    />
  );
}
