
export type DisabilityCategory = 'visual' | 'auditiva' | 'habla';

export type Page = 'home' | 'category_menu' | 'devices' | 'functionalities' | 'tools';

export type Theme = 'light' | 'dark';

export interface Device {
  nombre: string;
  descripcion: string;
  caracteristicas: string[];
  imageUrl: string;
}

export interface Functionality {
  nombre: string;
  descripcion: string;
  plataformas: string[];
  imageUrl: string;
}
