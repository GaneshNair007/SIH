"use client";

import { useAuth, Role } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { ShieldAlert, User, Briefcase, Settings, Shield } from "lucide-react";

export default function LoginPage() {
  const { setRole } = useAuth();
  const router = useRouter();

  const handleLogin = (role: Role) => {
    setRole(role);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">H₂S Monitor Platform</h1>
          <p className="text-gray-500 text-center mt-2">
            Select your role to access the platform.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => handleLogin("Worker")}
            className="w-full flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <User className="text-gray-400 mr-4" />
            <div className="text-left">
              <div className="font-semibold text-gray-900">Worker</div>
              <div className="text-sm text-gray-500">View personal exposure history</div>
            </div>
          </button>

          <button
            onClick={() => handleLogin("Shift Manager")}
            className="w-full flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Briefcase className="text-gray-400 mr-4" />
            <div className="text-left">
              <div className="font-semibold text-gray-900">Shift Manager</div>
              <div className="text-sm text-gray-500">Scan bands and manage shifts</div>
            </div>
          </button>

          <button
            onClick={() => handleLogin("Control Room Manager")}
            className="w-full flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Shield className="text-gray-400 mr-4" />
            <div className="text-left">
              <div className="font-semibold text-gray-900">Control Room Manager</div>
              <div className="text-sm text-gray-500">Monitor plant-wide status</div>
            </div>
          </button>

          <button
            onClick={() => handleLogin("Admin")}
            className="w-full flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings className="text-gray-400 mr-4" />
            <div className="text-left">
              <div className="font-semibold text-gray-900">Admin</div>
              <div className="text-sm text-gray-500">System configuration</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
