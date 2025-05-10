export interface Color {
  id: number;
  description: string;
  hash: string;
}

export class ColorSave {
  id: number;
  description: string;
  hash: string;
  constructor(color: Color) {
    this.id = color.id;
    this.description = color.description;
    this.hash = color.hash;
  }
}
