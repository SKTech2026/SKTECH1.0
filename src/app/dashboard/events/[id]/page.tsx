import EventDetailView from "../event-detail-view";

type EventDetailPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params;

  return <EventDetailView id={id} />;
}
