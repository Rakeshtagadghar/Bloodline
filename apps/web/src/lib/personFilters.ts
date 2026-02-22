import type { Person } from "@bloodline/core";

export type LivingFilter = "all" | "living" | "deceased";

export interface PersonFilters {
  tag: string;
  branch: string;
  living: LivingFilter;
}

export const DEFAULT_PERSON_FILTERS: PersonFilters = {
  tag: "",
  branch: "",
  living: "all"
};

export function getPersonLivingStatus(person: Person): "living" | "deceased" | "unknown" {
  if (person.privacy?.living === true) {
    return "living";
  }
  if (person.privacy?.living === false) {
    return "deceased";
  }
  if (person.died) {
    return "deceased";
  }
  if (person.born) {
    return "living";
  }
  return "unknown";
}

export function matchesPersonFilters(person: Person, filters: PersonFilters): boolean {
  if (filters.tag && !(person.tags ?? []).includes(filters.tag)) {
    return false;
  }

  if (filters.branch && person.house !== filters.branch) {
    return false;
  }

  if (filters.living !== "all") {
    const status = getPersonLivingStatus(person);
    if (filters.living === "living" && status !== "living") {
      return false;
    }
    if (filters.living === "deceased" && status !== "deceased") {
      return false;
    }
  }

  return true;
}

export function matchesPersonSearch(person: Person, searchQuery: string): boolean {
  const query = searchQuery.trim().toLowerCase();
  if (!query) {
    return true;
  }
  return (person.displayName ?? person.name).toLowerCase().includes(query);
}

export function collectFilterOptions(people: Person[]): {
  tags: string[];
  branches: string[];
} {
  const tagSet = new Set<string>();
  const branchSet = new Set<string>();

  for (const person of people) {
    for (const tag of person.tags ?? []) {
      tagSet.add(tag);
    }
    if (person.house) {
      branchSet.add(person.house);
    }
  }

  return {
    tags: [...tagSet].sort((a, b) => a.localeCompare(b)),
    branches: [...branchSet].sort((a, b) => a.localeCompare(b))
  };
}
