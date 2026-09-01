import ResourcePage from "@/components/operations/ResourcePage";

export default function ManagerSectionPage({ params }: { params: { section: string[] } }) {
  return <ResourcePage surface="manager" segments={params.section}/>;
}

