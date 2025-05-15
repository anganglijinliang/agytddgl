import { 
  User, 
  Order, 
  Customer, 
  SubOrder, 
  Production, 
  ProductionLine, 
  Shipping,
  Warehouse 
} from "@prisma/client";

export type OrderWithDetails = Order & {
  customer: Customer;
  user: User;
  subOrders: SubOrderWithDetails[];
};

export type SubOrderWithDetails = SubOrder & {
  productionLine?: ProductionLine | null;
  warehouse?: Warehouse | null;
  production?: Production[];
  shipping?: Shipping[];
};

export type ProductionWithDetails = Production & {
  user: User;
  subOrder: SubOrder & {
    order: Order & {
      customer: Customer;
    };
    productionLine?: ProductionLine | null;
  };
};

export type ShippingWithDetails = Shipping & {
  user: User;
  subOrder: SubOrder & {
    order: Order & {
      customer: Customer;
    };
    warehouse?: Warehouse | null;
  };
}; 