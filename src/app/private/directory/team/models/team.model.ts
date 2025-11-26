export interface ITeam {
  id: number;
  dni: number;
  name: string;
  surname: string;
  salary: string;
}

export class Team {
  id: number;
  dni: number;
  name: string;
  surname: string;
  salary: string;

  constructor(team: ITeam) {
    this.id = team.id;
    this.dni = team.dni;
    this.name = team.name;
    this.surname = team.surname;
    this.salary = team.salary;
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
