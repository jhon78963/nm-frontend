export interface ITeam {
  id: number;
  dni: string | number;
  name: string;
  surname: string;
  salary: string | number | null;
  warehouseId: number;
  userId?: number | null;
  userEmail?: string | null;
}

/** Cuerpo para crear o editar colaborador (API camelCase). */
export interface TeamPayload {
  dni: string | number;
  name: string;
  surname: string;
  salary: string | number | null;
  warehouseId: number;
}

export interface TeamCreateLogin {
  email: string;
  username: string;
  temporaryPassword: string;
}

export interface TeamCreateResponse {
  message: string;
  data: ITeam;
  login: TeamCreateLogin;
}

export class Team {
  id: number;
  dni: string | number;
  name: string;
  surname: string;
  salary: string | number | null;
  warehouseId: number;
  userId?: number | null;
  userEmail?: string | null;

  constructor(team: ITeam) {
    this.id = team.id;
    this.dni = team.dni;
    this.name = team.name;
    this.surname = team.surname;
    this.salary = team.salary;
    this.warehouseId = team.warehouseId;
    this.userId = team.userId;
    this.userEmail = team.userEmail;
  }
}

export interface Paginate {
  total: number;
  pages: number;
}

export interface TeamListResponse {
  data: Team[];
  paginate: Paginate;
}
