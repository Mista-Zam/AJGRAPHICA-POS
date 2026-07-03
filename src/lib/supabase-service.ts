import { supabase } from "./supabase";

export interface FinanceRecord {
  id: string;
  customerName: string;
  jobType: string;
  description: string;
  quantity: number;
  amount: number;
  downPayment: number;
  paymentStatus: string;
  pickupDate: string;
  completedAt: string;
  createdAt: string;
}

export interface ShopSettings {
  shopName: string;
  address: string;
  contactNumber: string;
  facebookPage: string;
  defaultPaymentTerms: string;
  smsReminders: boolean;
}

export type JobType = "T-Shirt" | "Polo Shirt" | "Tarpaulin" | "Uniform" | "Alteration" | "Jacket" | "Other";
export type Fabric = "Cotton" | "Sublimation";
export type JobStatus = "Urgent" | "In Progress" | "For Pickup" | "Done" | "Normal";
export type PaymentStatus = "Unpaid" | "Partial" | "Paid";
export type JobStage = "Received" | "In Progress" | "For Pickup" | "Completed";

export interface Jobbing {
  id: string;
  customerName: string;
  contactNumber: string;
  address?: string;
  jobType: JobType;
  description: string;
  fabric?: Fabric;
  quantity: number;
  pickupDate: string;
  amount: number;
  downPayment: number;
  status: JobStatus;
  stage: JobStage;
  paymentStatus: PaymentStatus;
  notes: string;
  createdAt: string;
  isUrgent: boolean;
  attachment?: string;
}

interface JobbingRow {
  id: string;
  customer_name: string;
  contact_number: string;
  address: string | null;
  job_type: string;
  description: string;
  fabric: string | null;
  quantity: number;
  pickup_date: string;
  amount: number;
  down_payment: number;
  status: string;
  stage: string;
  payment_status: string;
  notes: string;
  is_urgent: boolean;
  attachment: string | null;
  created_at: string;
  updated_at: string;
}

interface FinanceRecordRow {
  id: string;
  jobbing_id: string;
  customer_name: string;
  job_type: string;
  description: string;
  quantity: number;
  amount: number;
  down_payment: number;
  payment_status: string;
  pickup_date: string;
  completed_at: string;
  created_at: string;
}

function rowToJobbing(row: JobbingRow): Jobbing {
  return {
    id: row.id,
    customerName: row.customer_name,
    contactNumber: row.contact_number,
    address: row.address ?? undefined,
    jobType: row.job_type as JobType,
    description: row.description,
    fabric: row.fabric as Fabric | undefined,
    quantity: row.quantity,
    pickupDate: row.pickup_date,
    amount: Number(row.amount),
    downPayment: Number(row.down_payment),
    status: row.status as JobStatus,
    stage: row.stage as JobStage,
    paymentStatus: row.payment_status as PaymentStatus,
    notes: row.notes,
    createdAt: row.created_at,
    isUrgent: row.is_urgent,
    attachment: row.attachment ?? undefined,
  };
}

function jobbingToRow(jobbing: Partial<Jobbing>): Record<string, unknown> {
  return {
    id: jobbing.id,
    customer_name: jobbing.customerName,
    contact_number: jobbing.contactNumber,
    address: jobbing.address ?? null,
    job_type: jobbing.jobType,
    description: jobbing.description,
    fabric: jobbing.fabric ?? null,
    quantity: jobbing.quantity,
    pickup_date: jobbing.pickupDate,
    amount: jobbing.amount ?? 0,
    down_payment: jobbing.downPayment ?? 0,
    status: jobbing.status,
    stage: jobbing.stage,
    payment_status: jobbing.paymentStatus,
    notes: jobbing.notes ?? "",
    is_urgent: jobbing.isUrgent ?? false,
    attachment: jobbing.attachment ?? null,
  };
}

function financeRowToRecord(row: FinanceRecordRow): FinanceRecord {
  return {
    id: row.id,
    customerName: row.customer_name,
    jobType: row.job_type,
    description: row.description,
    quantity: row.quantity,
    amount: Number(row.amount),
    downPayment: Number(row.down_payment),
    paymentStatus: row.payment_status,
    pickupDate: row.pickup_date,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  };
}

export async function getAllJobbings(): Promise<Jobbing[]> {
  const { data, error } = await supabase
    .from("jobbings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: unknown) => rowToJobbing(row as JobbingRow));
}

export async function addJobbing(jobbing: Jobbing): Promise<void> {
  const { error } = await supabase.from("jobbings").insert(jobbingToRow(jobbing));
  if (error) throw error;
}

export async function getJobbing(id: string): Promise<Jobbing | undefined> {
  const { data, error } = await supabase
    .from("jobbings")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToJobbing(data as unknown as JobbingRow) : undefined;
}

export async function updateJobbing(jobbing: Jobbing): Promise<void> {
  const { error } = await supabase
    .from("jobbings")
    .update(jobbingToRow(jobbing))
    .eq("id", jobbing.id);
  if (error) throw error;
}

export async function deleteJobbing(id: string): Promise<void> {
  await supabase.from("finance_records").delete().eq("jobbing_id", id);
  const { error } = await supabase.from("jobbings").delete().eq("id", id);
  if (error) throw error;
}

export async function saveFinanceRecord(record: FinanceRecord): Promise<void> {
  const { error } = await supabase.from("finance_records").upsert({
    id: record.id,
    jobbing_id: record.id,
    customer_name: record.customerName,
    job_type: record.jobType,
    description: record.description,
    quantity: record.quantity,
    amount: record.amount,
    down_payment: record.downPayment,
    payment_status: record.paymentStatus,
    pickup_date: record.pickupDate,
    completed_at: record.completedAt,
  });
  if (error) throw error;
}

export async function getAllFinances(): Promise<FinanceRecord[]> {
  const { data, error } = await supabase
    .from("finance_records")
    .select("*")
    .order("completed_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: unknown) => financeRowToRecord(row as FinanceRecordRow));
}

export async function deleteFinanceRecord(id: string): Promise<void> {
  const { error } = await supabase.from("finance_records").delete().eq("id", id);
  if (error) throw error;
}

const DEFAULT_SETTINGS: ShopSettings = {
  shopName: "AJ Graphica",
  address: "Malita, Davao Occidental",
  contactNumber: "0970 265 4944",
  facebookPage: "A&J Graphica",
  defaultPaymentTerms: "50% down payment required upon order. Balance upon pickup.",
  smsReminders: true,
};

export async function getSettings(): Promise<ShopSettings> {
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "shop")
    .maybeSingle();
  if (error && error.code !== "PGRST116") throw error;
  if (data) {
    const record = data as { value: ShopSettings };
    return record.value;
  }
  await supabase.from("settings").insert({ key: "shop", value: DEFAULT_SETTINGS });
  return DEFAULT_SETTINGS;
}

export async function saveSettings(settings: ShopSettings): Promise<void> {
  const { error } = await supabase.from("settings").upsert({ key: "shop", value: settings });
  if (error) throw error;
}

export async function clearAllData(): Promise<void> {
  await supabase.from("jobbings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("finance_records").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("settings").delete().eq("key", "shop");
}
