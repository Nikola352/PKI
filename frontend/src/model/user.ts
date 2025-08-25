export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export type UserRole = "REGULAR_USER" | "CA_USER" | "ADMINISTRATOR";
