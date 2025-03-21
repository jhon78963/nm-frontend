export interface IRole {
  id: number;
  name: string;
}

export class Role {
  id: number;
  name: string;

  constructor(role: IRole) {
    this.id = role.id;
    this.name = role.name;
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
