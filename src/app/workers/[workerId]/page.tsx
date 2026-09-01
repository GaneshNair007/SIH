import AppShell from "@/components/layout/AppShell";
import WorkerProfileContent from "@/components/operations/WorkerProfileContent";

export default function WorkerProfilePage({ params }: { params: { workerId: string } }) {
  return <AppShell requiredRoles={["SHIFT_MANAGER", "CONTROL_ROOM_MANAGER", "ADMIN"]}><WorkerProfileContent workerId={params.workerId}/></AppShell>;
}

