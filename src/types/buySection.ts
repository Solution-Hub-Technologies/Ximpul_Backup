
export interface Edition {
  id?: string;
  name: string;
  value: string;
  price: number;
  description: string;
  image_url?: string;
  stock_black?: number;
  stock_grey?: number;
}

export interface Color {
  name: string;
  value: string;
  color: string;
}

export interface Accessory {
  id?: string;
  name: string;
  price: number;
  note: string;
  stock_black?: number;
  stock_grey?: number;
  stock_default?: number;
}

export interface BuyState {
  selectedEdition: string;
  selectedColor: string;
  selectedAccessories: string[];
  engravingText: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  paymentMethod: string;
}
