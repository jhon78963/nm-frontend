export interface ISocialNetwork {
  id: number;
  name: string;
  icon: string;
  url: string;
  companyId: number;
}

export class SocialNetwork {
  id: number;
  name: string;
  icon: string;
  url: string;
  companyId: number;

  constructor(user: ISocialNetwork) {
    this.id = user.id;
    this.name = user.name;
    this.icon = user.icon;
    this.url = user.url;
    this.companyId = user.companyId;
  }
}

export interface Paginate {
  total: number;
  pages: number;
}

export interface SocialNetworkistResponse {
  data: SocialNetwork[];
  paginate: Paginate;
}
