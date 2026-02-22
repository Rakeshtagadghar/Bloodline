import { validateDataset, type FamilyDataset, type ValidationIssue } from "@bloodline/core";

type JsonInput = object | string | number | boolean | null;

export type DatasetLoadResult =
  | { ok: true; dataset: FamilyDataset }
  | { ok: false; errors: ValidationIssue[] };

export async function loadDatasetFromUrl(url: string): Promise<DatasetLoadResult> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    return {
      ok: false,
      errors: [
        {
          code: "http_error",
          path: "$",
          message: `Failed to load dataset (${response.status} ${response.statusText})`
        }
      ]
    };
  }

  let parsedJson: JsonInput;
  try {
    parsedJson = await response.json();
  } catch (error) {
    return {
      ok: false,
      errors: [
        {
          code: "invalid_json",
          path: "$",
          message: error instanceof Error ? error.message : "Invalid JSON response"
        }
      ]
    };
  }

  const validated = validateDataset(parsedJson);
  if (Array.isArray(validated)) {
    return { ok: false, errors: validated };
  }

  return { ok: true, dataset: validated };
}
