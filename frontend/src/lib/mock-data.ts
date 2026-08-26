
// Mock data is now served from the database via API.
// This file is kept as a placeholder to avoid breaking imports during refactoring
// but returns empty arrays or types.

export interface User {
  id: string;
  name: string;
  initials: string;
  role: string;
  avatar: string;
}

export const MOCK_USERS: User[] = [];
