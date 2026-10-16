import { PlannerClient } from "@/components/PlannerClient";

interface PlannerPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PlannerPage({ params }: PlannerPageProps) {
  const { id } = await params;

  // Read FUEL_PRICE_NGN_PER_LITRE on the server and pass to client component
  const rawPrice = process.env.FUEL_PRICE_NGN_PER_LITRE;
  const fuelPricePerLitre = rawPrice && !isNaN(parseFloat(rawPrice))
    ? parseFloat(rawPrice)
    : undefined;

  return <PlannerClient runId={id} fuelPricePerLitre={fuelPricePerLitre} />;
}
