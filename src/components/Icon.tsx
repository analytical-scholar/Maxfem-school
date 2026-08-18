import {
  Award,
  Blocks,
  BookOpen,
  Building2,
  Compass,
  Flag,
  FlaskConical,
  Globe2,
  GraduationCap,
  HeartHandshake,
  Laptop,
  MonitorSmartphone,
  Palette,
  ShieldCheck,
  Trophy,
  UserRoundCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

const icons = {
  Award,
  Blocks,
  BookOpen,
  Building2,
  Compass,
  Flag,
  FlaskConical,
  Globe2,
  GraduationCap,
  HeartHandshake,
  Laptop,
  MonitorSmartphone,
  Palette,
  ShieldCheck,
  Trophy,
  UserRoundCheck,
  Users,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof icons;

export function Icon({ name, className }: { name: IconName | string; className?: string }) {
  const Cmp = icons[name as IconName] ?? Compass;
  return <Cmp className={className} aria-hidden="true" />;
}
