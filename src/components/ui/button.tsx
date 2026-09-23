import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Jedyny przycisk w aplikacji.
 *
 * Zasady, które wymusza za wszystkich:
 * - widoczny focus ring (bez niego aplikacja jest nieużywalna z klawiatury),
 * - `loading` blokuje podwójne kliknięcie i pokazuje spinner w środku,
 * - `disabled` zawsze z `cursor-not-allowed` — user widzi, że nie zadziała.
 *
 * Wariant `primary` używa --vairo-strong, bo biały tekst na pełnym #ee5f1c
 * ma kontrast ~3.3:1. Na przyciemnionym tle wychodzi powyżej progu.
 */
const buttonVariants = cva(
  [
    "relative inline-flex shrink-0 items-center justify-center gap-2",
    "font-medium whitespace-nowrap select-none",
    "transition-[background-color,border-color,color,transform] duration-150",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--vairo)]",
    "active:scale-[.98]",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--vairo-strong)] text-white hover:bg-[var(--vairo)] shadow-[0_2px_12px_rgba(238,95,28,.25)]",
        secondary:
          "border border-white/12 bg-[var(--surface-2)] text-[var(--text-muted)] hover:border-white/20 hover:bg-[var(--surface-3)] hover:text-white",
        ghost:
          "text-[var(--text-subtle)] hover:bg-white/[0.06] hover:text-white",
        danger:
          "border border-[var(--danger)]/30 bg-[var(--danger)]/10 text-[var(--danger)] hover:bg-[var(--danger)]/20",
      },
      size: {
        sm: "h-8 rounded-[10px] px-3 text-[13px] [&_svg]:size-3.5",
        md: "h-10 rounded-xl px-4 text-[14px] [&_svg]:size-4",
        lg: "h-12 rounded-xl px-6 text-[15px] [&_svg]:size-[18px]",
        icon: "size-10 rounded-xl [&_svg]:size-4",
        "icon-sm": "size-8 rounded-[10px] [&_svg]:size-3.5",
      },
      // `w-full` musi wygrac z bazowym `shrink-0` — inaczej dwa przyciski
      // `block` w jednym rzedzie flex zajmuja 2 x 100% i wychodza poza
      // kontener, bo nie wolno im sie sciesnic.
      block: { true: "w-full shrink min-w-0", false: "" },
    },
    defaultVariants: { variant: "primary", size: "md", block: false },
  }
);

type ButtonBaseProps = VariantProps<typeof buttonVariants> & {
  loading?: boolean;
  className?: string;
  children?: React.ReactNode;
};

type ButtonProps = ButtonBaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color"> & {
    href?: never;
  };

type ButtonLinkProps = ButtonBaseProps &
  Omit<React.ComponentPropsWithoutRef<typeof Link>, "color"> & {
    href: string;
  };

export function Button(props: ButtonProps | ButtonLinkProps) {
  const {
    className,
    variant,
    size,
    block,
    loading,
    children,
    ...rest
  } = props as ButtonBaseProps & Record<string, unknown>;

  const classes = cn(buttonVariants({ variant, size, block }), className);

  const content = (
    <>
      {loading ? (
        <Loader2
          className="absolute size-4 animate-spin"
          aria-hidden="true"
        />
      ) : null}
      <span
        className={cn(
          "inline-flex items-center gap-2",
          loading && "invisible"
        )}
      >
        {children}
      </span>
    </>
  );

  if (typeof rest.href === "string") {
    const { href, ...linkRest } = rest as { href: string } & Record<
      string,
      unknown
    >;
    return (
      <Link
        href={href}
        className={classes}
        {...(linkRest as Omit<React.ComponentPropsWithoutRef<typeof Link>, "href">)}
      >
        {content}
      </Link>
    );
  }

  const { disabled, type, ...buttonRest } = rest as {
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
  } & Record<string, unknown>;

  return (
    <button
      type={type ?? "button"}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes}
      {...(buttonRest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {content}
    </button>
  );
}

export { buttonVariants };
