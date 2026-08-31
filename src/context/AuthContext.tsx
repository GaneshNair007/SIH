"use client";
import React, { createContext, useContext, useState } from "react";

export type Role = "Shift Manager" | "Control Room Manager" | "Worker" | "Admin";

interface AuthContextType {
  role: Role | null;
  setRole: (role: Role | null) => void;
  userName: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [role, setRole] = useState<Role | null>(null);

  const userName = 
    role === "Worker" ? "John Doe" : 
    role === "Shift Manager" ? "Manager Alice" : 
    role === "Control Room Manager" ? "Supervisor Bob" :
    role === "Admin" ? "System Admin" : "";

  return (
    <AuthContext.Provider value={{ role, setRole, userName }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
