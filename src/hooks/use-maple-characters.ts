"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchMapleCharacter,
  fetchMapleCharacters,
  registerMapleCharacter,
} from "@/lib/api-client";
import { mapleQueryKeys } from "@/lib/query-keys";

export function useMapleCharacters() {
  return useQuery({
    queryKey: mapleQueryKeys.characters(),
    queryFn: fetchMapleCharacters,
  });
}

export function useRegisterMapleCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registerMapleCharacter,
    onSuccess: async (character) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: mapleQueryKeys.charactersRoot,
        }),
        queryClient.invalidateQueries({
          queryKey: mapleQueryKeys.character(character.ocid),
        }),
      ]);
    },
  });
}

export function useMapleCharacter(ocid: string) {
  return useQuery({
    queryKey: mapleQueryKeys.character(ocid),
    queryFn: () => fetchMapleCharacter(ocid),
    enabled: ocid.trim().length > 0,
    staleTime: 5 * 60 * 1000,
  });
}
