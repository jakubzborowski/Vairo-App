import {
  Bell,
  Compass,
  Flag,
  FolderOpen,
  HelpCircle,
  LayoutDashboard,
  ListTodo,
  Mail,
  MessageSquare,
  Settings,
  Target,
  UserRound,
  Users,
  Waypoints,
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
 * Moduły Execution (Cele, Taski, Rozpiska) są w menu, gdy startup domknął
 * Preparation — `requiresExecution`. Wcześniej nie ma wyszarzonych pozycji.
 */
export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badgeKey?: "messages" | "inbox" | "notifications";
  /** Pokazujemy po domknięciu Preparation. Wcześniej pozycji nie ma w menu. */
  requiresExecution?: boolean;
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
      { label: "Cele", href: "/app/goals", icon: Flag, requiresExecution: true },
      { label: "Taski", href: "/app/tasks", icon: ListTodo, requiresExecution: true },
      { label: "Rozpiska", href: "/app/workflows", icon: Waypoints, requiresExecution: true },
      { label: "Pliki", href: "/app/files", icon: FolderOpen },
      { label: "Team", href: "/app/team", icon: Users },
    ],
  },
  {
    id: "social",
    label: "Social",
    collapsible: true,
    items: [
      { label: "Odkrywaj", href: "/app/social/discover", icon: Compass },
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

export function isActivePath(pathname: string, href: string) {
  if (href === "/app") return pathname === "/app";
  return pathname === href || pathname.startsWith(`${href}/`);
}
