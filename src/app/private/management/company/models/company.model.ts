export interface ICompany {
  id?: number;
  businessName: string;
  representativeLegal: null;
  address: string;
  phoneNumber: string;
  email: string;
  googleMapsLocation: string;
}

export class Company {
  id?: number;
  businessName?: string;
  representativeLegal?: null;
  address?: string;
  phoneNumber?: string;
  email?: string;
  googleMapsLocation?: string;

  constructor(user: ICompany) {
    this.id = user.id;
    this.businessName = user.businessName;
    this.representativeLegal = user.representativeLegal;
    this.address = user.address;
    this.phoneNumber = user.phoneNumber;
    this.email = user.email;
    this.googleMapsLocation = user.googleMapsLocation;
  }
}
