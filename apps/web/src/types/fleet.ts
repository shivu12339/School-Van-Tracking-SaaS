export interface FleetUser {
  id: string;
  email: string;
  firstName: string;
  lastName?: string | null;
  phone?: string | null;
  isActive?: boolean;
}

export interface Driver {
  id: string;
  schoolId: string;
  userId: string;
  licenseNumber: string;
  licenseValidTill?: string | null;
  employeeCode?: string | null;
  isAvailable: boolean;
  user: FleetUser;
  assignedVanId?: string | null;
}

export interface Van {
  id: string;
  schoolId: string;
  registrationNo: string;
  label?: string | null;
  capacity: number;
  isActive: boolean;
}

export interface Student {
  id: string;
  schoolId: string;
  fullName: string;
  admissionNumber: string;
  grade?: string | null;
  section?: string | null;
  routeId?: string | null;
  parent?: { id: string; user?: FleetUser };
}

export interface Parent {
  id: string;
  schoolId: string;
  userId: string;
  user: FleetUser;
}

export interface Route {
  id: string;
  schoolId: string;
  routeCode: string;
  routeName: string;
  direction: string;
  isActive: boolean;
  van?: { id: string; registrationNo: string; label?: string | null };
}

export interface Trip {
  id: string;
  schoolId: string;
  status: string;
  direction: string;
  tripDate: string;
  startedAt?: string | null;
  endedAt?: string | null;
  van?: { id: string; registrationNo: string; label?: string | null };
  route?: { id: string; routeName: string; routeCode: string };
  driver?: { id: string; user?: { firstName: string; lastName?: string | null } };
  _count?: { tripStudents: number };
}

export interface TripAnalytics {
  total: number;
  scheduled: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  pickup: number;
  dropoff: number;
  return: number;
}
