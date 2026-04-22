import { Permission } from '../models/roles.model';

/** Opciones agrupadas para p-multiSelect con [group]="true". */
export function buildPermissionGroups(
  perms: Permission[],
): { label: string; items: { label: string; value: string }[] }[] {
  const map = new Map<string, { label: string; value: string }[]>();
  for (const p of perms) {
    const g = p.group?.trim() || 'Otros';
    if (!map.has(g)) {
      map.set(g, []);
    }
    map.get(g)!.push({ label: p.label ?? p.name, value: p.name });
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'es'))
    .map(([label, items]) => ({
      label,
      items: items.sort((x, y) => x.label.localeCompare(y.label, 'es')),
    }));
}
