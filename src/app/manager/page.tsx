"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, LogOut, Users, UserPlus, Search, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";

const workerSchema = z.object({
  full_name: z.string().min(2, "Name is required"),
  worker_code: z.string().min(2, "Worker ID is required"),
  employee_hr_id: z.string().optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  plant_id: z.string().optional(),
  default_region_id: z.string().optional(),
  default_work_area_id: z.string().optional(),
});

type WorkerFormData = z.infer<typeof workerSchema>;

export default function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState<"view" | "add">("view");
  const queryClient = useQueryClient();

  // Fetch workers
  const { data: workers, isLoading } = useQuery({
    queryKey: ['workers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<WorkerFormData>({
    resolver: zodResolver(workerSchema)
  });

  // Add Worker Mutation
  const addWorkerMutation = useMutation({
    mutationFn: async (data: WorkerFormData) => {
      const { error } = await supabase.from('workers').insert({
        ...data,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Worker added successfully!");
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      reset();
      setActiveTab("view");
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  const onSubmit = (data: WorkerFormData) => {
    addWorkerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-300">
      
      {/* NAVBAR */}
      <nav className="border-b border-slate-800 bg-slate-900 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck size={28} className="text-cyan-400" />
            <div>
              <div className="text-white font-bold leading-tight">Manager Dashboard</div>
              <div className="text-xs text-slate-400">Control Room & Shift Management</div>
            </div>
          </div>
          <Link href="/login" className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
            <LogOut size={16} /> Log Out
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        
        {/* TABS */}
        <div className="flex gap-4 mb-8 border-b border-slate-800 pb-px">
          <button 
            onClick={() => setActiveTab("view")}
            className={`pb-4 px-2 font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === "view" ? "border-cyan-500 text-cyan-400" : "border-transparent text-slate-400 hover:text-slate-300"}`}
          >
            <Users size={18} /> View Workers
          </button>
          <button 
            onClick={() => setActiveTab("add")}
            className={`pb-4 px-2 font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === "add" ? "border-cyan-500 text-cyan-400" : "border-transparent text-slate-400 hover:text-slate-300"}`}
          >
            <UserPlus size={18} /> Add New Worker
          </button>
        </div>

        {/* CONTENT */}
        {activeTab === "view" ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex justify-between items-center gap-4 flex-wrap">
              <h2 className="text-2xl font-bold text-white">Active Workforce</h2>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Search workers..." 
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden min-h-[300px]">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="animate-spin text-cyan-500" size={32} />
                </div>
              ) : workers?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                  <Users size={48} className="mb-4 opacity-30" />
                  <p>No workers found in database.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-900/50">
                      <th className="p-4 font-bold text-slate-400">Worker</th>
                      <th className="p-4 font-bold text-slate-400">ID</th>
                      <th className="p-4 font-bold text-slate-400">Department</th>
                      <th className="p-4 font-bold text-slate-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {workers?.map((w: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-700/50 transition-colors cursor-pointer">
                        <td className="p-4 font-medium text-white flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs">{w.full_name?.charAt(0) || '?'}</div>
                          {w.full_name}
                        </td>
                        <td className="p-4">
                          <div className="text-white font-mono">{w.worker_code}</div>
                        </td>
                        <td className="p-4 text-slate-400">{w.department || '-'}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-green-900/30 text-green-400 border-green-700/50">
                            {w.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl bg-slate-800 border border-slate-700 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Register New Worker</h2>

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Full Name *</label>
                  <input {...register("full_name")} type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500" />
                  {errors.full_name && <p className="text-red-400 text-xs mt-1">{errors.full_name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Worker ID *</label>
                  <input {...register("worker_code")} type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500" />
                  {errors.worker_code && <p className="text-red-400 text-xs mt-1">{errors.worker_code.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Employee/HR ID</label>
                  <input {...register("employee_hr_id")} type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Phone Number</label>
                  <input {...register("phone")} type="tel" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Department</label>
                  <input {...register("department")} type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Designation</label>
                  <input {...register("designation")} type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500" />
                </div>
              </div>
              
              <div className="pt-6">
                <button 
                  type="submit" 
                  disabled={addWorkerMutation.isPending}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {addWorkerMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  Submit New Worker
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </main>
    </div>
  );
}
