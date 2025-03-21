export interface IHour {
  id: number;
  duration: number;
  durationString: string;
}

export class Hour {
  id: number;
  duration: number;
  durationString: string;

  constructor(hour: IHour) {
    this.id = hour.id;
    this.duration = hour.duration;
    this.durationString = hour.durationString;
  }
}

export interface Paginate {
  total: number;
  pages: number;
}

export interface HourListResponse {
  data: Hour[];
  paginate: Paginate;
}
