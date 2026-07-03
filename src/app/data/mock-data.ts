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
  pickupDate: string; // ISO date
  amount: number;
  downPayment: number;
  status: JobStatus;
  stage: JobStage;
  paymentStatus: PaymentStatus;
  notes: string;
  createdAt: string; // ISO date
  isUrgent: boolean;
  attachment?: string; // base64 data URL of attached image
}


