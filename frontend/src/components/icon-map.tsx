"use client";

import {
  BookOpen,
  Briefcase,
  ClipboardCheck,
  FileCog,
  FileText,
  FolderKanban,
  Shield,
  ShieldCheck,
  Truck,
  Users,
  Waves,
  Building2,
  type LucideIcon
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  ShieldCheck,
  FileText,
  BookOpen,
  Users,
  Shield,
  Briefcase,
  ClipboardCheck,
  FolderKanban,
  FileCog,
  Waves,
  Truck,
  Building2
};

export function IconMap({
  name,
  className
}: {
  name?: string | null;
  className?: string;
}) {
  const Icon = (name && icons[name]) || FileText;
  return <Icon className={className} />;
}
