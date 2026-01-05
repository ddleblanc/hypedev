/**
 * Attribution Service - Cookie-based referral tracking for Hype Network
 *
 * Sets and reads attribution cookies to track which affiliate link
 * brought a user to the platform, enabling commission attribution on purchase.
 */
import { cookies } from "next/headers";

// Cookie configuration
const COOKIE_NAME = "hpx_ref";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Attribution data stored in cookie
 */
export interface AttributionData {
  linkId: string;
  agentId: string;
  campaignId: string;
  code: string;
  clickedAt: number; // Unix timestamp in ms
}

/**
 * Set attribution cookie after a link click
 * This persists the referral attribution for 7 days
 */
export async function setAttributionCookie(
  data: Omit<AttributionData, "clickedAt">
): Promise<void> {
  const cookieStore = await cookies();

  const attributionData: AttributionData = {
    ...data,
    clickedAt: Date.now(),
  };

  // Serialize and set cookie
  cookieStore.set(COOKIE_NAME, JSON.stringify(attributionData), {
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

/**
 * Get attribution data from cookie
 * Returns null if no cookie, expired, or invalid data
 */
export async function getAttributionData(): Promise<AttributionData | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);

  if (!cookie?.value) {
    return null;
  }

  try {
    const data = JSON.parse(cookie.value) as AttributionData;

    // Validate required fields
    if (!data.linkId || !data.agentId || !data.campaignId || !data.clickedAt) {
      console.warn("[Attribution] Invalid attribution data in cookie");
      return null;
    }

    // Check if cookie data has expired (7 days)
    const maxAgeMs = COOKIE_MAX_AGE * 1000;
    if (Date.now() - data.clickedAt > maxAgeMs) {
      console.log("[Attribution] Attribution cookie expired");
      return null;
    }

    return data;
  } catch (error) {
    console.error("[Attribution] Failed to parse attribution cookie:", error);
    return null;
  }
}

/**
 * Check if user has active attribution
 */
export async function hasAttribution(): Promise<boolean> {
  const data = await getAttributionData();
  return data !== null;
}

/**
 * Get attribution for a specific campaign
 * Returns null if no attribution or different campaign
 */
export async function getAttributionForCampaign(
  campaignId: string
): Promise<AttributionData | null> {
  const data = await getAttributionData();

  if (!data || data.campaignId !== campaignId) {
    return null;
  }

  return data;
}

/**
 * Clear attribution cookie after conversion
 * Call this after successfully recording a commission
 */
export async function clearAttributionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Update attribution with new click (overwrites existing)
 * Newer clicks take precedence over older ones
 */
export async function updateAttribution(
  data: Omit<AttributionData, "clickedAt">
): Promise<void> {
  // Simply set new cookie - this overwrites any existing
  await setAttributionCookie(data);
}

/**
 * Get time remaining on attribution (in seconds)
 * Returns 0 if no attribution or expired
 */
export async function getAttributionTimeRemaining(): Promise<number> {
  const data = await getAttributionData();

  if (!data) {
    return 0;
  }

  const maxAgeMs = COOKIE_MAX_AGE * 1000;
  const elapsed = Date.now() - data.clickedAt;
  const remaining = maxAgeMs - elapsed;

  return Math.max(0, Math.floor(remaining / 1000));
}

/**
 * Server action to check attribution from client
 * Use this in server components or API routes
 */
export async function checkAttribution(): Promise<{
  hasAttribution: boolean;
  data: AttributionData | null;
  expiresIn: number;
}> {
  const data = await getAttributionData();
  const expiresIn = await getAttributionTimeRemaining();

  return {
    hasAttribution: data !== null,
    data,
    expiresIn,
  };
}
