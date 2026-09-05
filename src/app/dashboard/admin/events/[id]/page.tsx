import EventDetailView from "@/app/dashboard/events/event-detail-view";

export const dynamic = "force-dynamic";

type AdminEventDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEventDetailPage({
  params,
}: AdminEventDetailPageProps) {
  const { id } = await params;

  return <EventDetailView id={id} eventBasePath="/dashboard/admin/events" />;
}