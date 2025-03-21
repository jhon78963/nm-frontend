export interface IDay {
  id: number;
  name: number;
  abbreviation: string;
}

export class Day {
  id: number;
  name: number;
  abbreviation: string;

  constructor(day: IDay) {
    this.id = day.id;
    this.name = day.name;
    this.abbreviation = day.abbreviation;
  }
}

export interface Paginate {
  total: number;
  pages: number;
}

export interface DayListResponse {
  data: Day[];
  paginate: Paginate;
}
