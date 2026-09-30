import {
  Bell,
  Compass,
  HelpCircle,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Settings,
  Target,
  Globe,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Jedno źródło prawdy dla nawigacji.
 *
 * **Zasada: w menu jest tylko to, co działa.** Nie ma pozycji wyszarzonych,
 * „wkrótce" ani prowadzących do ekranu z informacją, że czegoś jeszcze nie ma.
 * Człowiek, który pierwszy raz widzi tę aplikację, nie ma jak odróżnić
 * „nieaktywne, bo jeszcze nie powstało" od „nieaktywne, bo coś zrobiłem źle" —
 * a połowa wyszarzonego menu wygląda jak aplikacja, która się nie wczytała.
 *
 * Moduły, które wrócą tu razem z Execution Stage (mają już własne ekrany pod
 * swoimi adresami, tylko nie są linkowane): Taski, Cele, Dokumenty, Workflow,
 * Możliwości. Wejdą wtedy, gdy będą miały dane — nie wcześniej.
 */
export type NavItem = {
  label: string;
  /** Pozycja widoczna wyłącznie dla Foundera i Admina aktywnego teamu. */
  requiresManage?: boolean;
  href: string;
  icon: LucideIcon;
  badgeKey?: "messages" | "inbox" | "notifications";
};

export type NavGroup = {
  id: "team" | "social";
  label: string;
  collapsible: boolean;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    // Cała grupa znika, gdy user nie należy do żadnego startupu — wtedy ma
    // wyłącznie warstwę Social i nie ma czego wyszarzać.
    id: "team",
    label: "Twój team",
    collapsible: false,
    items: [
      { label: "Start", href: "/app", icon: LayoutDashboard },
      { label: "Etap startupu", href: "/app/stage", icon: Target },
      { label: "Team", href: "/app/team", icon: Users },
      // Profil publiczny teamu był dostępny wyłącznie przez przycisk
      // w nagłówku strony Team — czyli trzy kliknięcia do rzeczy, którą
      // widzą obcy i którą najczęściej się poprawia. Teraz stoi w menu,
      // ale tylko dla Foundera i Admina: dla Członka strona i tak
      // przekierowuje, a pozycja prowadząca pod zamknięte drzwi jest gorsza
      // niż jej brak.
      {
        label: "Profil publiczny",
        href: "/app/team/profile",
        icon: Globe,
        requiresManage: true,
      },
    ],
  },
  {
    id: "social",
    label: "Social",
    collapsible: true,
    items: [
      // DWA wejścia, nie jedno — i dwa PRAWDZIWE adresy, nie jeden z zakładką.
      //
      // „Odkrywaj" było jedną pozycją z zakładkami w środku, więc decyzję
      // „szukam projektu czy szukam ludzi" podejmowało się dopiero PO wejściu
      // — a to jest najważniejsze rozwidlenie w całej warstwie Social i jedyne
      // pytanie, na które trzeba odpowiedzieć, zanim cokolwiek się zobaczy.
      //
      // Pierwsza wersja rozdzielenia trzymała obie talie pod jednym
      // `pathname` z `?tab=`. To się nie broniło: goły adres musiał zgadywać,
      // którą talię pokazać, więc ten sam link otwierał u dwóch osób dwie
      // różne rzeczy. Zakładka opisuje stan, a to są miejsca.
      {
        label: "Szukam projektu",
        href: "/app/social/teams",
        icon: Compass,
      },
      {
        label: "Szukam ludzi",
        href: "/app/social/people",
        icon: Users,
      },
      {
        label: "Wiadomości",
        href: "/app/social/messages",
        icon: MessageSquare,
        badgeKey: "messages",
      },
      {
        // Jedna skrzynka na wszystko, co czeka na decyzję: zaczepki od ludzi
        // i sprawy członkostwa w teamie. Dwa osobne wejścia z osobnymi
        // licznikami brzmiały dla nowej osoby tak samo.
        label: "Zaproszenia",
        href: "/app/social/invites",
        icon: Mail,
        badgeKey: "inbox",
      },
      {
        label: "Mój profil publiczny",
        href: "/app/social/me",
        icon: UserRound,
      },
    ],
  },
];

export const footerNav: NavItem[] = [
  {
    label: "Powiadomienia",
    href: "/app/notifications",
    icon: Bell,
    badgeKey: "notifications",
  },
  { label: "Jak to działa", href: "/app/program", icon: HelpCircle },
  { label: "Ustawienia", href: "/app/settings/profile", icon: Settings },
];

/**
 * Wszystkie adresy z menu — potrzebne, żeby rozstrzygnąć, która pozycja jest
 * „dokładniejsza" dla bieżącej ścieżki. Liczone raz, przy pierwszym użyciu.
 */
let cachedHrefs: string[] | null = null;
function allNavHrefs() {
  if (!cachedHrefs) {
    cachedHrefs = [
      ...navGroups.flatMap((group) => group.items.map((item) => item.href)),
      ...footerNav.map((item) => item.href),
    ];
  }
  return cachedHrefs;
}

export function isActivePath(pathname: string, href: string) {
  const base = href.split("?")[0];

  if (base === "/app") return pathname === "/app";

  const pathMatches = pathname === base || pathname.startsWith(`${base}/`);
  if (!pathMatches) return false;

  // Wygrywa DOKŁADNIEJSZE dopasowanie.
  //
  // „Team" (`/app/team`) i „Profil publiczny" (`/app/team/profile`) różnią się
  // tylko segmentem, więc prefiksowe dopasowanie zapalało obie naraz — menu
  // pokazywało dwie aktywne pozycje i nie dało się poznać, gdzie się jest.
  // Jeśli istnieje inna pozycja, której adres jest dłuższy i też pasuje do
  // bieżącej ścieżki, to ona jest tą aktywną.
  const moreSpecific = allNavHrefs().some((other) => {
    const otherBase = other.split("?")[0];
    if (otherBase.length <= base.length) return false;
    return pathname === otherBase || pathname.startsWith(`${otherBase}/`);
  });
  if (moreSpecific) return false;

  return true;
}
