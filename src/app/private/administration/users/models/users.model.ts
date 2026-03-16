export interface IUser {
  id: number;
  username: string;
  email: string;
  name: string;
  surname: string;
  profilePicture: string;
  googleId?: number;
  roleId: number;
  warehouseId: number;
}

export class User {
  id: number;
  username: string;
  email: string;
  name: string;
  surname: string;
  profilePicture: string;
  googleId?: number;
  roleId: number;
  warehouseId: number;

  constructor(user: IUser) {
    this.id = user.id;
    this.username = user.username;
    this.email = user.email;
    this.name = user.name;
    this.surname = user.surname;
    this.profilePicture = user.profilePicture;
    this.googleId = user.googleId;
    this.roleId = user.roleId;
    this.warehouseId = user.warehouseId;
  }
}

export interface Paginate {
  total: number;
  pages: number;
}

export interface UserListResponse {
  data: User[];
  paginate: Paginate;
}
