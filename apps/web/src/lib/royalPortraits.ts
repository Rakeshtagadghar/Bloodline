import type { FamilyDataset, MediaAsset, Person } from "@bloodline/core";

const BRITISH_ROYAL_WIKI_PAGE_BY_PERSON_ID: Record<string, string> = {
  p_queen_elizabeth_ii: "Elizabeth_II",
  p_prince_philip: "Prince_Philip,_Duke_of_Edinburgh",
  p_charles: "Charles_III",
  p_diana: "Diana,_Princess_of_Wales",
  p_camilla: "Camilla",
  p_anne: "Anne,_Princess_Royal",
  p_mark_phillips: "Mark_Phillips",
  p_timothy_laurence: "Tim_Laurence",
  p_andrew: "Prince_Andrew,_Duke_of_York",
  p_sarah_ferguson: "Sarah,_Duchess_of_York",
  p_edward: "Prince_Edward,_Duke_of_Edinburgh",
  p_sophie: "Sophie,_Duchess_of_Edinburgh",
  p_prince_william: "William,_Prince_of_Wales",
  p_kate_middleton: "Catherine,_Princess_of_Wales",
  p_prince_harry: "Prince_Harry,_Duke_of_Sussex",
  p_meghan_markle: "Meghan,_Duchess_of_Sussex",
  p_prince_george: "Prince_George_of_Wales",
  p_princess_charlotte: "Princess_Charlotte_of_Wales",
  p_peter_phillips: "Peter_Phillips",
  p_autumn_kelly: "Autumn_Phillips",
  p_savannah_phillips: "Savannah_Phillips",
  p_isla_phillips: "Isla_Phillips",
  p_zara_phillips: "Zara_Tindall",
  p_mike_tindall: "Mike_Tindall",
  p_mia_tindall: "Mia_Tindall",
  p_princess_eugenie: "Princess_Eugenie",
  p_jack_brooksbank: "Jack_Brooksbank",
  p_princess_beatrice: "Princess_Beatrice",
  p_lady_louise: "Lady_Louise_Windsor",
  p_james: "James,_Earl_of_Wessex"
};

interface WikiSummaryImage {
  source?: string;
}

interface WikiSummaryResponse {
  thumbnail?: WikiSummaryImage;
  originalimage?: WikiSummaryImage;
}

const summaryPortraitCache = new Map<string, string | null>();
const summaryRequestCache = new Map<string, Promise<string | null>>();

function isPortraitMedia(media: MediaAsset): boolean {
  return media.type === "portrait" || media.type === "photo";
}

export function buildMediaById(dataset: FamilyDataset | null): Map<string, MediaAsset> {
  return new Map(dataset?.media?.map((asset) => [asset.id, asset]) ?? []);
}

export function getPortraitUrlFromDatasetMedia(
  person: Person,
  mediaById: ReadonlyMap<string, MediaAsset>
): string | null {
  for (const mediaId of person.mediaIds ?? []) {
    const media = mediaById.get(mediaId);
    if (!media || !isPortraitMedia(media)) {
      continue;
    }
    if (typeof media.url === "string" && media.url.length > 0) {
      return media.url;
    }
  }
  return null;
}

export function hasBritishRoyalPortraitLookup(personId: string): boolean {
  return personId in BRITISH_ROYAL_WIKI_PAGE_BY_PERSON_ID;
}

async function fetchWikipediaSummaryPortrait(pageTitle: string): Promise<string | null> {
  const cached = summaryPortraitCache.get(pageTitle);
  if (cached !== undefined) {
    return cached;
  }

  const inFlight = summaryRequestCache.get(pageTitle);
  if (inFlight) {
    return inFlight;
  }

  const request = (async () => {
    try {
      const response = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`
      );
      if (!response.ok) {
        summaryPortraitCache.set(pageTitle, null);
        return null;
      }

      const payload = (await response.json()) as Partial<WikiSummaryResponse>;
      const portraitUrl = payload.thumbnail?.source ?? payload.originalimage?.source ?? null;
      summaryPortraitCache.set(pageTitle, portraitUrl);
      return portraitUrl;
    } catch {
      summaryPortraitCache.set(pageTitle, null);
      return null;
    } finally {
      summaryRequestCache.delete(pageTitle);
    }
  })();

  summaryRequestCache.set(pageTitle, request);
  return request;
}

export async function fetchBritishRoyalPortraitUrl(personId: string): Promise<string | null> {
  const pageTitle = BRITISH_ROYAL_WIKI_PAGE_BY_PERSON_ID[personId];
  if (!pageTitle) {
    return null;
  }
  return fetchWikipediaSummaryPortrait(pageTitle);
}

