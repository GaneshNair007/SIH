import ResourcePage from "@/components/operations/ResourcePage";

export default function AdminSectionPage({ params }: { params: { section: string[] } }) {
  return <ResourcePage surface="admin" segments={params.section}/>;
}

