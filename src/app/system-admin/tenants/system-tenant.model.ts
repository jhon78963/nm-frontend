export interface SystemTenant {
  id: number;
  name: string;
  isActive: boolean;
  features: string[];
  usersCount: number;
  createdAt: string | null;
}

export interface FeatureOption {
  label: string;
  value: string;
}

export interface ProvisionPayload {
  tenant_name: string;
  admin_name: string;
  admin_email: string;
  admin_password: string;
  features: string[];
}

export const FEATURE_OPTIONS: FeatureOption[] = [
  { label: 'Facturación Electrónica', value: 'electronic_billing' },
  { label: 'E-commerce',              value: 'ecommerce' },
  { label: 'Multi-Sucursal',          value: 'multi_branch' },
  { label: 'Reportes Avanzados',      value: 'advanced_reports' },
  { label: 'Pasarela de Pago',        value: 'payment_gateway' },
  { label: 'API Pública',             value: 'public_api' },
];
