"use client";

import { useQuery } from "@tanstack/react-query";
import { managerApi } from "@/lib/api/manager";
import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import { useState } from "react";

export default function EmployeesPage() {
  const { data: employees, isLoading, error } = useQuery({
    queryKey: ["employees"],
    queryFn: managerApi.getEmployees,
  });

  const [search, setSearch] = useState("");

  const filtered = employees?.filter(e => 
    e.full_name.toLowerCase().includes(search.toLowerCase()) || 
    e.employee_id.toLowerCase().includes(search.toLowerCase()) ||
    e.plant_unit.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-medium text-text-primary">Workforce Roster</h1>
          <p className="text-sm text-text-secondary mt-1">Manage employee longitudinal dosimetry records</p>
        </div>
        
        <div className="w-full sm:w-72">
          <input 
            type="text" 
            placeholder="Search by name, ID or unit..." 
            className="input-field"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading && (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-status-errorBg border border-status-error text-status-error rounded-md">
          Failed to load employees.
        </div>
      )}

      {filtered && (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-background text-xs font-medium text-text-secondary uppercase tracking-wider">
                <th className="px-5 py-3 border-b border-border">Employee</th>
                <th className="px-5 py-3 border-b border-border">ID</th>
                <th className="px-5 py-3 border-b border-border">Plant Unit</th>
                <th className="px-5 py-3 border-b border-border">Active Badge</th>
                <th className="px-5 py-3 border-b border-border">7-Day Load (ppm·h)</th>
                <th className="px-5 py-3 border-b border-border text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm text-text-primary">
              {filtered.map((emp) => {
                const load = emp.exposure_ledger?.rolling_7day_ppm_hr || 0;
                let badgeClass = "badge-success";
                if (load > 20) badgeClass = "badge-error";
                else if (load > 10) badgeClass = "badge-warning";

                return (
                  <tr key={emp.employee_id} className="hover:bg-surface-hover transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap font-medium text-text-primary">
                      {emp.full_name}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-text-secondary">
                      {emp.employee_id}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-text-secondary">
                      {emp.plant_unit}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-mono text-xs bg-surface-background border border-border px-2 py-1 rounded text-text-secondary">
                        {emp.active_badge_id}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={badgeClass}>
                          {emp.exposure_ledger?.rolling_7day_range_str || "0.0–0.0 ppm·h"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <Link href={`/employees/${emp.employee_id}`} className="text-primary hover:text-primary-hover font-medium text-sm">
                        View Details
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-text-secondary">
                    No employees match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
