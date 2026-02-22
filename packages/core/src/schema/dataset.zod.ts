import { z } from "zod";

const privacyLevelSchema = z.enum(["public", "family", "private"]);

const personPrivacySchema = z
  .object({
    visibility: privacyLevelSchema.default("family"),
    hideDates: z.boolean().default(false),
    hideLocation: z.boolean().default(false),
    living: z.boolean().optional()
  })
  .partial()
  .passthrough();

const personDisplaySchema = z
  .object({
    styleTitle: z.string().optional(),
    crestId: z.string().optional(),
    badgeIds: z.array(z.string()).optional(),
    accentColorToken: z.string().optional()
  })
  .passthrough();

const personSchema = z
  .object({
    id: z.string().regex(/^p_[a-zA-Z0-9_-]+$/),
    name: z.string(),
    displayName: z.string().optional(),
    gender: z.enum(["female", "male", "nonbinary", "unknown"]).optional(),
    born: z.string().optional(),
    died: z.string().optional(),
    placeOfBirth: z.string().optional(),
    currentLocation: z.string().optional(),
    tags: z.array(z.string()).optional(),
    house: z.string().optional(),
    display: personDisplaySchema.optional(),
    bio: z.string().optional(),
    privacy: personPrivacySchema.optional(),
    mediaIds: z.array(z.string()).optional()
  })
  .passthrough();

const relationshipSchema = z
  .object({
    id: z.string().regex(/^rel_[a-zA-Z0-9_-]+$/),
    type: z.enum(["parent", "partner", "guardian", "step_parent"]),
    parentId: z.string().optional(),
    childId: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    kind: z.enum(["biological", "adopted", "unknown"]).optional(),
    status: z.enum(["married", "partnered", "divorced", "separated", "widowed"]).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    notes: z.string().optional(),
    privacy: privacyLevelSchema.default("family").optional()
  })
  .passthrough();

const eventSchema = z
  .object({
    id: z.string().regex(/^ev_[a-zA-Z0-9_-]+$/),
    type: z.enum(["birth", "death", "marriage", "divorce", "move", "achievement", "note"]),
    date: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
    personIds: z.array(z.string()).optional(),
    relationshipId: z.string().optional(),
    mediaIds: z.array(z.string()).optional(),
    privacy: privacyLevelSchema.default("family").optional()
  })
  .passthrough();

const successionSchema = z
  .object({
    asOf: z.string(),
    mode: z.enum(["manual", "computed"]).default("manual"),
    list: z.array(
      z
        .object({
          rank: z.number().min(1),
          personId: z.string(),
          label: z.string().optional()
        })
        .passthrough()
    ),
    rulesNote: z.string().optional()
  })
  .passthrough();

const mediaAssetSchema = z
  .object({
    id: z.string().regex(/^m_[a-zA-Z0-9_-]+$/),
    type: z.enum(["portrait", "photo", "document", "audio", "video"]),
    url: z.string(),
    caption: z.string().optional(),
    attribution: z.string().optional(),
    privacy: privacyLevelSchema.default("family").optional()
  })
  .passthrough();

const uiConfigSchema = z
  .object({
    theme: z.enum(["royal-archive", "royal-night", "royal-parchment"]).default("royal-archive"),
    defaultRootPersonId: z.string(),
    layout: z.enum(["descendant", "ancestor", "both", "radial"]).default("descendant"),
    featureFlags: z
      .object({
        editor: z.boolean().default(true).optional(),
        timeline: z.boolean().default(true).optional(),
        succession: z.boolean().default(true).optional(),
        export: z.boolean().default(true).optional(),
        privacyMode: z.boolean().default(true).optional()
      })
      .partial()
      .passthrough()
      .optional(),
    labels: z
      .object({
        familyName: z.string().optional(),
        motto: z.string().optional()
      })
      .passthrough()
      .optional(),
    branding: z
      .object({
        crest: z.string().optional(),
        watermarkText: z.string().optional()
      })
      .passthrough()
      .optional()
  })
  .passthrough();

const metaSchema = z
  .object({
    dataset: z.string(),
    version: z.string(),
    displayName: z.string(),
    motto: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    sourceNotes: z.array(z.string()).optional()
  })
  .passthrough();

export const familyDatasetSchema = z
  .object({
    meta: metaSchema,
    people: z.array(personSchema),
    relationships: z.array(relationshipSchema),
    events: z.array(eventSchema).optional(),
    succession: successionSchema.optional(),
    media: z.array(mediaAssetSchema).optional(),
    ui: uiConfigSchema
  })
  .passthrough();

export type FamilyDataset = z.infer<typeof familyDatasetSchema>;
export type Person = z.infer<typeof personSchema>;
export type Relationship = z.infer<typeof relationshipSchema>;
export type Event = z.infer<typeof eventSchema>;
export type MediaAsset = z.infer<typeof mediaAssetSchema>;
export type UIConfig = z.infer<typeof uiConfigSchema>;

export interface ValidationIssue {
  code: string;
  path: string;
  message: string;
}

type ValidationInput = object | string | number | boolean | null | undefined;

function pathToString(path: Array<string | number>): string {
  if (path.length === 0) {
    return "$";
  }
  return path
    .map((segment) => (typeof segment === "number" ? `[${segment}]` : `${segment}`))
    .join(".")
    .replace(".[", "[");
}

function addIssue(issues: ValidationIssue[], issue: ValidationIssue): void {
  issues.push(issue);
}

function parseFailureToIssues(input: ValidationInput): ValidationIssue[] | null {
  const parsed = familyDatasetSchema.safeParse(input);
  if (parsed.success) {
    return null;
  }
  return parsed.error.issues.map((issue) => ({
    code: issue.code,
    path: pathToString(issue.path),
    message: issue.message
  }));
}

function collectPersonIdsAndDuplicates(dataset: FamilyDataset, issues: ValidationIssue[]): Set<string> {
  const personIds = new Set<string>();

  for (let index = 0; index < dataset.people.length; index += 1) {
    const person = dataset.people[index];
    if (personIds.has(person.id)) {
      addIssue(issues, {
        code: "duplicate_id",
        path: `people[${index}].id`,
        message: `duplicate person id: ${person.id}`
      });
    }
    personIds.add(person.id);
  }

  return personIds;
}

function addMissingPersonReferenceIssue(
  issues: ValidationIssue[],
  relationshipIndex: number,
  fieldName: "parentId" | "childId" | "from" | "to",
  personId: string
): void {
  addIssue(issues, {
    code: "missing_reference",
    path: `relationships[${relationshipIndex}].${fieldName}`,
    message: `relationship references missing person: ${personId}`
  });
}

function validateRelationshipReferences(
  relationship: Relationship,
  relationshipIndex: number,
  personIds: Set<string>,
  issues: ValidationIssue[]
): void {
  if (relationship.parentId && !personIds.has(relationship.parentId)) {
    addMissingPersonReferenceIssue(issues, relationshipIndex, "parentId", relationship.parentId);
  }
  if (relationship.childId && !personIds.has(relationship.childId)) {
    addMissingPersonReferenceIssue(issues, relationshipIndex, "childId", relationship.childId);
  }
  if (relationship.from && !personIds.has(relationship.from)) {
    addMissingPersonReferenceIssue(issues, relationshipIndex, "from", relationship.from);
  }
  if (relationship.to && !personIds.has(relationship.to)) {
    addMissingPersonReferenceIssue(issues, relationshipIndex, "to", relationship.to);
  }
}

function validateRelationships(
  dataset: FamilyDataset,
  personIds: Set<string>,
  issues: ValidationIssue[]
): void {
  const relationshipIds = new Set<string>();

  for (let index = 0; index < dataset.relationships.length; index += 1) {
    const relationship = dataset.relationships[index];

    if (relationshipIds.has(relationship.id)) {
      addIssue(issues, {
        code: "duplicate_id",
        path: `relationships[${index}].id`,
        message: `duplicate relationship id: ${relationship.id}`
      });
    }
    relationshipIds.add(relationship.id);

    validateRelationshipShape(relationship, index, issues);
    validateRelationshipReferences(relationship, index, personIds, issues);
  }
}

function validateDefaultRootReference(
  dataset: FamilyDataset,
  personIds: Set<string>,
  issues: ValidationIssue[]
): void {
  if (personIds.has(dataset.ui.defaultRootPersonId)) {
    return;
  }

  addIssue(issues, {
    code: "missing_reference",
    path: "ui.defaultRootPersonId",
    message: `default root person not found: ${dataset.ui.defaultRootPersonId}`
  });
}

function validateBiologicalParentLimit(dataset: FamilyDataset, issues: ValidationIssue[]): void {
  const biologicalParentCounts = new Map<string, number>();

  for (const relationship of dataset.relationships) {
    if (relationship.type !== "parent" || !relationship.childId) {
      continue;
    }
    if (relationship.kind && relationship.kind !== "biological") {
      continue;
    }
    biologicalParentCounts.set(
      relationship.childId,
      (biologicalParentCounts.get(relationship.childId) ?? 0) + 1
    );
  }

  for (const [childId, count] of biologicalParentCounts) {
    if (count <= 2) {
      continue;
    }
    addIssue(issues, {
      code: "constraint",
      path: "relationships",
      message: `${childId} has more than 2 biological/unknown parents`
    });
  }
}

function validateParentCycleConstraint(dataset: FamilyDataset, issues: ValidationIssue[]): void {
  const cycle = detectParentCycle(dataset.relationships);
  if (!cycle) {
    return;
  }

  addIssue(issues, {
    code: "cycle",
    path: "relationships",
    message: `parent-child cycle detected: ${cycle.join(" -> ")}`
  });
}

function detectParentCycle(relationships: Relationship[]): string[] | null {
  const childrenByParent = new Map<string, Set<string>>();
  const people = new Set<string>();

  for (const rel of relationships) {
    if (rel.type !== "parent" || !rel.parentId || !rel.childId) {
      continue;
    }
    people.add(rel.parentId);
    people.add(rel.childId);
    let children = childrenByParent.get(rel.parentId);
    if (!children) {
      children = new Set<string>();
      childrenByParent.set(rel.parentId, children);
    }
    children.add(rel.childId);
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];

  const dfs = (node: string): string[] | null => {
    if (visiting.has(node)) {
      const startIndex = stack.indexOf(node);
      return [...stack.slice(startIndex), node];
    }
    if (visited.has(node)) {
      return null;
    }
    visiting.add(node);
    stack.push(node);
    for (const child of childrenByParent.get(node) ?? []) {
      const cycle = dfs(child);
      if (cycle) {
        return cycle;
      }
    }
    stack.pop();
    visiting.delete(node);
    visited.add(node);
    return null;
  };

  for (const personId of people) {
    const cycle = dfs(personId);
    if (cycle) {
      return cycle;
    }
  }

  return null;
}

function validateRelationshipShape(relationship: Relationship, index: number, issues: ValidationIssue[]) {
  if (relationship.type === "parent") {
    if (!relationship.parentId) {
      addIssue(issues, {
        code: "custom",
        path: `relationships[${index}].parentId`,
        message: "parent relationship requires parentId"
      });
    }
    if (!relationship.childId) {
      addIssue(issues, {
        code: "custom",
        path: `relationships[${index}].childId`,
        message: "parent relationship requires childId"
      });
    }
    if (relationship.from || relationship.to) {
      addIssue(issues, {
        code: "custom",
        path: `relationships[${index}]`,
        message: "parent relationship must not include from/to"
      });
    }
  }

  if (relationship.type === "partner") {
    if (!relationship.from || !relationship.to) {
      addIssue(issues, {
        code: "custom",
        path: `relationships[${index}]`,
        message: "partner relationship requires from and to"
      });
    }
    if (relationship.parentId || relationship.childId) {
      addIssue(issues, {
        code: "custom",
        path: `relationships[${index}]`,
        message: "partner relationship must not include parentId/childId"
      });
    }
  }
}

export function validateDataset(input: ValidationInput): FamilyDataset | ValidationIssue[] {
  const parseIssues = parseFailureToIssues(input);
  if (parseIssues) {
    return parseIssues;
  }

  const dataset = familyDatasetSchema.parse(input);
  const issues: ValidationIssue[] = [];
  const personIds = collectPersonIdsAndDuplicates(dataset, issues);

  validateRelationships(dataset, personIds, issues);
  validateDefaultRootReference(dataset, personIds, issues);
  validateBiologicalParentLimit(dataset, issues);
  validateParentCycleConstraint(dataset, issues);

  return issues.length > 0 ? issues : dataset;
}
