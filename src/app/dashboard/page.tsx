"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogOut, Scan, Activity, Users, AlertTriangle, ShieldCheck, Clock } from "lucide-react";

export default function DashboardPage() {
  const { role, userName, setRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!role) {
      router.push("/");
    }
  }, [role, router]);

  const handleLogout = () => {
    setRole(null);
    router.push("/");
  };

  if (!role) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            {role === "Worker" ? <Users size={20} /> : role === "Shift Manager" ? <Scan size={20} /> : <Activity size={20} />}
          </div>
          <div>
            <h1 className="font-bold text-gray-900 leading-tight">{userName}</h1>
            <p className="text-xs text-gray-500 font-medium">{role}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        
        {/* =======================
            SHIFT MANAGER VIEW 
            ======================= */}
        {role === "Shift Manager" && (
          <div className="space-y-6">
            <div className="bg-blue-600 text-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-2">Shift Actions</h2>
              <p className="text-blue-100 mb-6 text-sm">Use your device camera to scan wristbands at shift start and end.</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => router.push("/scan")}
                  className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <Scan size={20} />
                  Start / End Shift Scan
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Shifts (Zone A)</h3>
              <div className="bg-white border rounded-xl overflow-hidden">
                <div className="divide-y">
                  {[
                    { name: "John Doe", band: "H2S-001", start: "08:00 AM" },
                    { name: "Jane Smith", band: "H2S-002", start: "08:15 AM" },
                    { name: "Mike Johnson", band: "H2S-003", start: "08:30 AM" }
                  ].map((worker, i) => (
                    <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                          <Users size={18} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{worker.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{worker.band}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{worker.start}</p>
                        <p className="text-xs text-green-600 font-medium">In Progress</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =======================
            WORKER VIEW 
            ======================= */}
        {role === "Worker" && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="font-semibold text-gray-900">Current Band</h2>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">ACTIVE</span>
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-blue-50 border-4 border-blue-100 rounded-full flex items-center justify-center">
                    <ShieldCheck className="text-blue-600" size={32} />
                  </div>
                  <div>
                    <p className="font-mono text-lg font-bold text-gray-900">H2S-882</p>
                    <p className="text-sm text-gray-500">Assigned 2 days ago</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-center gap-3">
                  <Clock className="text-gray-400" size={20} />
                  <div className="text-sm">
                    <span className="font-semibold text-gray-900">3 days</span>
                    <span className="text-gray-500"> remaining before replacement</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-6 shadow-sm flex flex-col justify-center">
                <h2 className="font-medium text-gray-400 mb-2">Total Exposure (Current Band)</h2>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-5xl font-light tracking-tight">10-30</span>
                  <span className="text-gray-400 font-medium mb-1">ppm·h</span>
                </div>
                <p className="text-sm text-gray-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400"></span>
                  Safe Range
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Shifts</h3>
              <div className="bg-white border rounded-xl overflow-hidden">
                <div className="divide-y">
                  {[
                    { date: "Yesterday, 08:00 - 16:00", exposure: "0 - 10 ppm·h", status: "safe" },
                    { date: "Aug 29, 08:00 - 16:00", exposure: "10 - 30 ppm·h", status: "safe" },
                    { date: "Aug 28, 08:00 - 16:00", exposure: "30 - 60 ppm·h", status: "warning" },
                  ].map((shift, i) => (
                    <div key={i} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{shift.date}</p>
                        <p className="text-sm text-gray-500 mt-1">Exposure: <span className="font-mono font-medium">{shift.exposure}</span></p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        shift.status === 'safe' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {shift.status === 'safe' ? 'SAFE' : 'ELEVATED'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =======================
            CONTROL ROOM MANAGER VIEW 
            ======================= */}
        {role === "Control Room Manager" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border rounded-xl p-5 shadow-sm">
                <p className="text-sm text-gray-500 font-medium mb-1">Active Workers</p>
                <h3 className="text-3xl font-bold text-gray-900">142</h3>
              </div>
              <div className="bg-white border rounded-xl p-5 shadow-sm">
                <p className="text-sm text-gray-500 font-medium mb-1">Elevated Exposures (Today)</p>
                <h3 className="text-3xl font-bold text-yellow-600">3</h3>
              </div>
              <div className="bg-white border rounded-xl p-5 shadow-sm">
                <p className="text-sm text-gray-500 font-medium mb-1">System Status</p>
                <h3 className="text-2xl font-bold text-green-600 flex items-center gap-2 mt-1">
                  <CheckCircle2 size={24} /> Normal
                </h3>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts & Elevated Readings</h3>
              <div className="bg-white border border-yellow-200 rounded-xl overflow-hidden">
                <div className="divide-y divide-yellow-100">
                  <div className="p-4 bg-yellow-50 flex gap-4">
                    <div className="mt-1 text-yellow-600">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-yellow-900">Worker M. Johnson (H2S-003)</h4>
                      <p className="text-sm text-yellow-800 mt-1">End of shift scan indicated exposure range 60-120 ppm·h. Confidence: MEDIUM.</p>
                      <p className="text-xs text-yellow-600 mt-2 font-medium">10 mins ago • Zone B</p>
                    </div>
                  </div>
                  <div className="p-4 flex gap-4">
                    <div className="mt-1 text-gray-400">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Worker R. Davis (H2S-105)</h4>
                      <p className="text-sm text-gray-600 mt-1">End of shift scan indicated exposure range 30-60 ppm·h. Confidence: HIGH.</p>
                      <p className="text-xs text-gray-500 mt-2 font-medium">2 hours ago • Zone A</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =======================
            ADMIN VIEW 
            ======================= */}
        {role === "Admin" && (
          <div className="bg-white border rounded-xl p-8 text-center text-gray-500">
            <Settings size={48} className="mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">System Configuration</h2>
            <p>Admin panel to manage users, bands, and calibration models is under construction.</p>
          </div>
        )}
      </main>
    </div>
  );
}

// Add a CheckCircle icon for Control Room
function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
