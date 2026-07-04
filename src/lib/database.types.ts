export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at">;
        Update: Partial<Omit<Profile, "id">>;
      };
      customers: {
        Row: Customer;
        Insert: Omit<Customer, "created_at" | "updated_at">;
        Update: Partial<Omit<Customer, "id">>;
      };
      services: {
        Row: Service;
        Insert: Omit<Service, "created_at" | "updated_at">;
        Update: Partial<Omit<Service, "id">>;
      };
      jobbings: {
        Row: JobbingRow;
        Insert: Omit<JobbingRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<JobbingRow, "id">>;
      };
      order_items: {
        Row: OrderItem;
        Insert: Omit<OrderItem, "id" | "created_at">;
        Update: Partial<Omit<OrderItem, "id">>;
      };
      payments: {
        Row: Payment;
        Insert: Omit<Payment, "id" | "created_at">;
        Update: Partial<Omit<Payment, "id">>;
      };
      expenses: {
        Row: Expense;
        Insert: Omit<Expense, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Expense, "id">>;
      };
      settings: {
        Row: SettingRow;
        Insert: Omit<SettingRow, "updated_at">;
        Update: Partial<Omit<SettingRow, "key">>;
      };
      finance_records: {
        Row: FinanceRecordRow;
        Insert: Omit<FinanceRecordRow, "id" | "created_at">;
        Update: Partial<Omit<FinanceRecordRow, "id">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      job_type: "T-Shirt" | "Polo Shirt" | "Tarpaulin" | "Uniform" | "Alteration" | "Jacket" | "Other";
      fabric: "Cotton" | "Sublimation";
      job_status: "Urgent" | "In Progress" | "For Pickup" | "Done" | "Normal";
      payment_status: "Unpaid" | "Partial" | "Paid";
      job_stage: "Received" | "In Progress" | "For Pickup" | "Completed";
      user_role: "admin" | "superadmin";
    };
  };
}

export type JobType = Database["public"]["Enums"]["job_type"];
export type Fabric = Database["public"]["Enums"]["fabric"];
export type JobStatus = Database["public"]["Enums"]["job_status"];
export type PaymentStatus = Database["public"]["Enums"]["payment_status"];
export type JobStage = Database["public"]["Enums"]["job_stage"];
export type UserRole = Database["public"]["Enums"]["user_role"];

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  contact_number: string;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  created_at: string;
  updated_at: string;
}

export interface JobbingRow {
  id: string;
  customer_name: string;
  contact_number: string;
  address: string | null;
  job_type: JobType;
  description: string;
  fabric: Fabric | null;
  quantity: number;
  pickup_date: string;
  amount: number;
  down_payment: number;
  status: JobStatus;
  stage: JobStage;
  payment_status: PaymentStatus;
  notes: string;
  is_urgent: boolean;
  attachment: string | null;
  is_purchase_order: boolean;
  po_status: string;
  payment_completed_at: string | null;
  due_date: string | null;
  po_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  jobbing_id: string;
  service_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface Payment {
  id: string;
  jobbing_id: string;
  amount: number;
  payment_method: string | null;
  payment_date: string;
  notes: string | null;
  reference_number: string | null;
  received_by: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SettingRow {
  key: string;
  value: Json;
  updated_at: string;
}

export interface FinanceRecordRow {
  id: string;
  jobbing_id: string;
  customer_name: string;
  job_type: JobType;
  description: string;
  quantity: number;
  amount: number;
  down_payment: number;
  payment_status: PaymentStatus;
  pickup_date: string;
  completed_at: string;
  created_at: string;
}


