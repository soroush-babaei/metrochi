import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },

    // Keep search results in memory when navigating between pages.
    // We don't want the router to restore/flush UI state based purely on location.
    scrollRestoration: true,
    defaultPreloadStaleTime: Infinity,
  });


  return router;
};
