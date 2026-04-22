export interface Permission {
  id: number;
  name: string;
  /** Etiqueta en español (módulo · acción). */
  label?: string;
  /** Agrupación para listas (ej. Ventas, Asistencias). */
  group?: string;
}

export interface IRole {
  id: number;
  name: string;
  permissions?: Permission[];
}

export class Role {
  id: number;
  name: string;
  permissions?: Permission[];

  constructor(role: IRole) {
    this.id = role.id;
    this.name = role.name;
    this.permissions = role.permissions;
  }
}

export interface Paginate {
  total: number;
  pages: number;
}

export interface RoleListResponse {
  data: Role[];
  paginate: Paginate;
}
