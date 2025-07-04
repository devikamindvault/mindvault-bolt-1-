import { useQuery } from "@tanstack/react-query";

  const { data: user, isLoading } = useQuery({
    retry: false,
  });

  return {
    user,
    isLoading,
  };
}