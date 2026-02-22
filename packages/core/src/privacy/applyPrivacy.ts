import type { FamilyDataset, Person } from "../schema/dataset.zod";

export type ViewerRole = "owner" | "family" | "public";

function cloneDataset(dataset: FamilyDataset): FamilyDataset {
  return {
    ...dataset,
    people: dataset.people.map((person) => ({ ...person, privacy: person.privacy ? { ...person.privacy } : undefined })),
    relationships: dataset.relationships.map((relationship) => ({ ...relationship })),
    events: dataset.events?.map((event) => ({ ...event, personIds: event.personIds ? [...event.personIds] : undefined })),
    media: dataset.media?.map((media) => ({ ...media })),
    succession: dataset.succession
      ? {
          ...dataset.succession,
          list: dataset.succession.list.map((item) => ({ ...item }))
        }
      : undefined,
    ui: {
      ...dataset.ui,
      featureFlags: dataset.ui.featureFlags ? { ...dataset.ui.featureFlags } : undefined,
      labels: dataset.ui.labels ? { ...dataset.ui.labels } : undefined,
      branding: dataset.ui.branding ? { ...dataset.ui.branding } : undefined
    },
    meta: { ...dataset.meta }
  };
}

function shouldHidePerson(person: Person, viewerRole: ViewerRole, privacyMode: boolean): boolean {
  if (!privacyMode || viewerRole === "owner") {
    return false;
  }
  const visibility = person.privacy?.visibility ?? "family";
  if (viewerRole === "family") {
    return visibility === "private";
  }
  if (viewerRole === "public") {
    return visibility === "private" || person.privacy?.living === true;
  }
  return false;
}

function redactPerson(person: Person, viewerRole: ViewerRole, privacyMode: boolean): Person {
  if (!privacyMode || viewerRole === "owner") {
    return person;
  }
  const redacted: Person = { ...person };
  if (person.privacy?.hideDates || viewerRole === "public") {
    delete redacted.born;
    delete redacted.died;
  }
  if (person.privacy?.hideLocation || viewerRole === "public") {
    delete redacted.placeOfBirth;
    delete redacted.currentLocation;
  }
  return redacted;
}

export function applyPrivacy(
  dataset: FamilyDataset,
  viewerRole: ViewerRole,
  privacyMode: boolean
): FamilyDataset {
  const clone = cloneDataset(dataset);
  const visiblePeople = clone.people
    .filter((person) => !shouldHidePerson(person, viewerRole, privacyMode))
    .map((person) => redactPerson(person, viewerRole, privacyMode));

  const visibleIds = new Set(visiblePeople.map((person) => person.id));

  clone.people = visiblePeople;
  clone.relationships = clone.relationships.filter((relationship) => {
    const refs = [relationship.parentId, relationship.childId, relationship.from, relationship.to].filter(
      Boolean
    ) as string[];
    return refs.every((id) => visibleIds.has(id));
  });
  clone.events = clone.events?.filter((event) => {
    if (!event.personIds || event.personIds.length === 0) {
      return true;
    }
    return event.personIds.every((id) => visibleIds.has(id));
  });
  if (!visibleIds.has(clone.ui.defaultRootPersonId) && clone.people.length > 0) {
    clone.ui.defaultRootPersonId = clone.people[0].id;
  }

  return clone;
}
