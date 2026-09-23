import { Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

type ComingSoonProps = {
  title: string;
  /** Po co ten moduł istnieje — nie „w budowie", tylko co tu będzie. */
  description: string;
  step?: number;
};

/**
 * Ekran modułu, który jeszcze nie powstał.
 *
 * Istnieje po to, żeby żadna pozycja nawigacji nie prowadziła donikąd i żeby
 * nikt nie wypełniał luki zmyślonymi danymi „na razie".
 */
export function ComingSoon({ title, description, step }: ComingSoonProps) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="font-heading text-[1.65rem] font-semibold tracking-tight text-white">
        {title}
      </h1>
      <div className="mt-6">
        <EmptyState
          icon={Construction}
          title="Ten moduł jeszcze nie powstał"
          description={
            step
              ? `${description} Zaplanowane na krok ${step} roadmapy.`
              : description
          }
          action={
            <Button href="/app" variant="secondary">
              Wróć na start
            </Button>
          }
        />
      </div>
    </div>
  );
}
