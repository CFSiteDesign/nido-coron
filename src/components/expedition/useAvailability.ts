import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAvailability } from "@/lib/booking.functions";

export const AVAILABILITY_KEY = ["expedition-availability"] as const;

// Seats left per departure id, or null while loading / when bookings aren't
// live. Counts only show when they come from real bookings.
export function useAvailability() {
  const fetchAvailability = useServerFn(getAvailability);
  const { data } = useQuery({
    queryKey: AVAILABILITY_KEY,
    queryFn: () => fetchAvailability(),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
  return data ?? null;
}

// Short label for a date chip, or null when there's nothing worth saying.
export function seatsLabel(left: number | undefined) {
  if (left === undefined) return null;
  if (left === 0) return "Sold out";
  if (left <= 6) return `${left} left`;
  return null;
}
