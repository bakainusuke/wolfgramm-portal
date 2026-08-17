import { ClientProfile } from "@/components/client-profile";

type ClientProfilePageProps = {
  params: Promise<{ clientId: string }>;
};

export default async function ClientProfilePage({ params }: ClientProfilePageProps) {
  const { clientId } = await params;

  return <ClientProfile clientId={clientId} />;
}
