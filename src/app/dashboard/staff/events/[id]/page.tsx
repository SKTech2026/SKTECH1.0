import EventDetailView from "@/app/dashboard/events/event-detail-view";

export const dynamic = "force-dynamic";

type StaffEventDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function StaffEventDetailPage({
  params,
}: StaffEventDetailPageProps) {
  const { id } = await params;

  return <EventDetailView id={id} eventBasePath="/dashboard/staff/events" />;
}
