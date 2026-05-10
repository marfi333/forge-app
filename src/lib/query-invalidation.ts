import type { QueryClient } from "@tanstack/react-query";

export function invalidateWorkoutDependentQueries(
  queryClient: QueryClient,
): Promise<void> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["stats"] }),
    queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
    queryClient.invalidateQueries({ queryKey: ["calendar"] }),
  ]).then(() => undefined);
}
