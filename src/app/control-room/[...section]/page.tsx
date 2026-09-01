import ResourcePage from "@/components/operations/ResourcePage";

export default function ControlRoomSectionPage({ params }: { params: { section: string[] } }) {
  return <ResourcePage surface="control-room" segments={params.section}/>;
}

