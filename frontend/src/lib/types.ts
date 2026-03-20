export interface Sector {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  sortOrder: number;
  kind: "DOCUMENT_LIBRARY" | "SUPPORT_CHANNEL" | "CHECKLIST_HUB";
  parentId?: string | null;
  children?: Category[];
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  status: string;
  roles: string[];
  permissions: string[];
  sectors: Sector[];
}

export interface DocumentRecord {
  id: string;
  title: string;
  code?: string | null;
  description?: string | null;
  versionLabel: string;
  versionNumber: number;
  status: string;
  visibility: string;
  publicationDate?: string | null;
  reviewDate?: string | null;
  effectiveDate?: string | null;
  keywords: string[];
  fileName?: string | null;
  sector: Sector;
  category: Category;
  subcategory?: Category | null;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  occurredAt: string;
  actor?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface AdminRole {
  id: string;
  name: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  lastLoginAt?: string | null;
  roles: AdminRole[];
  sectors: Sector[];
}
