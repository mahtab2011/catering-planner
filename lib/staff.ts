export type StaffRole =
  | "chef"
  | "assistant_chef"
  | "waiter"
  | "manager"
  | "cashier"
  | "cleaner"
  | "driver"
  | "packer";

export type StaffStatus = "active" | "inactive";

export type StaffMember = {
  id: string;
  ownerUid?: string;
  restaurantId?: string;
  restaurantName?: string;
  name: string;
  phone?: string;
  email?: string;
  role: StaffRole;
  hourlyRate: number;
  status: StaffStatus;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
};

export type StaffShift = {
  id: string;
  ownerUid?: string;
  restaurantId?: string;
  staffId: string;
  staffName: string;
  role: StaffRole;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  breakMinutes?: number;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
};