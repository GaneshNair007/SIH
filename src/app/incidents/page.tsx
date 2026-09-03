"use client";

import AppShell from "@/components/layout/AppShell";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";

interface Incident {
  incident_id: string;
  timestamp: string;
  worker_id: string;
  plant_unit: string;
  status: string;
  scan_id: string;
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const { data } = await apiClient.get("/manager/incidents");
        setIncidents(data);
      } catch (e: unknown) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchIncidents();
  }, []);

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-text-primary">Incidents Log</h1>
        <p className="text-sm text-text-secondary mt-1">Tier 3 critical breaches requiring OISD-STD-105 Form-A</p>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-background text-xs font-medium text-text-secondary uppercase tracking-wider">
                <th className="px-5 py-3 border-b border-border">Incident ID</th>
                <th className="px-5 py-3 border-b border-border">Date</th>
                <th className="px-5 py-3 border-b border-border">Worker ID</th>
                <th className="px-5 py-3 border-b border-border">Plant Unit</th>
                <th className="px-5 py-3 border-b border-border">Status</th>
                <th className="px-5 py-3 border-b border-border text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm text-text-primary">
              {incidents.map((inc) => (
                <tr key={inc.incident_id} className="hover:bg-surface-hover transition-colors">
                  <td className="px-5 py-4 font-medium text-primary">{inc.incident_id}</td>
                  <td className="px-5 py-4 text-text-secondary">
                    {new Date(inc.timestamp).toLocaleString()}
                  </td>
                  <td className="px-5 py-4">{inc.worker_id}</td>
                  <td className="px-5 py-4 text-text-secondary">{inc.plant_unit}</td>
                  <td className="px-5 py-4">
                    <span className={inc.status === "OPEN" ? "badge-error" : "badge-success"}>
                      {inc.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button 
                      onClick={() => window.open(`http://localhost:8000/api/manager/incident-pdf/${inc.scan_id}`, "_blank")}
                      className="text-primary hover:text-primary-hover font-medium text-sm"
                    >
                      Download PDF
                    </button>
                  </td>
                </tr>
              ))}
              {incidents.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-text-secondary">
                    No critical incidents recorded.
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
