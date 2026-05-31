export interface SocialLinks {
  facebook?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
}

export interface TenantSetting {
  ruc?: string | null;
  legalName?: string | null;
  tradeName?: string | null;
  address?: string | null;
  district?: string | null;
  province?: string | null;
  department?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  socialLinks?: SocialLinks;
  logoUrl?: string | null;
  ticketFooterNote?: string | null;
}

export interface Tenant {
  id: number;
  name: string;
  isActive?: boolean;
  setting?: TenantSetting;
}

export interface Paginate {
  total: number;
  pages: number;
}

export interface TenantListResponse {
  data: Tenant[];
  paginate: Paginate;
}
