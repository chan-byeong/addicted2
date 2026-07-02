import { MapleCharacterDetail } from "@/components/maple-character-detail";

type MapleCharacterPageProps = {
  params: Promise<{
    ocid: string;
  }>;
};

export default async function MapleCharacterPage({
  params,
}: MapleCharacterPageProps) {
  const { ocid } = await params;

  return <MapleCharacterDetail ocid={ocid} />;
}
