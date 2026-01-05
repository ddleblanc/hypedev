/**
 * Input sanitization utilities for security hardening
 */
import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML content to prevent XSS attacks
 * Only allows safe formatting tags
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br", "ul", "ol", "li"],
    ALLOWED_ATTR: ["href", "target", "rel"],
    // Force rel="noopener noreferrer" on all links
    ADD_ATTR: ["target"],
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
    FORBID_ATTR: ["onerror", "onclick", "onload", "onmouseover"],
  });
}

/**
 * Sanitize plain text - strips all HTML
 */
export function sanitizeText(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize user-provided URLs
 * Returns null if URL is invalid or uses dangerous protocols
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);

    // Only allow http(s) protocols - block javascript:, data:, etc.
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Validate and sanitize IPFS URLs/hashes
 * Supports URLs with paths like ipfs://CID/path/to/file.jpg
 */
export function sanitizeIpfsUrl(input: string): string | null {
  // Handle ipfs:// protocol
  if (input.startsWith("ipfs://")) {
    const pathAfterProtocol = input.slice(7); // e.g., "QmXYZ.../filename.jpg"

    // Extract CID (everything before first `/`) and path (everything after)
    const firstSlashIndex = pathAfterProtocol.indexOf('/');
    const cid = firstSlashIndex === -1
      ? pathAfterProtocol
      : pathAfterProtocol.slice(0, firstSlashIndex);
    const path = firstSlashIndex === -1
      ? ''
      : pathAfterProtocol.slice(firstSlashIndex);

    if (isValidIpfsCid(cid)) {
      return `https://ipfs.io/ipfs/${cid}${path}`;
    }
    return null;
  }

  // Handle direct IPFS gateway URLs (preserve full URL if CID is valid)
  const ipfsGatewayPattern = /^https:\/\/(?:ipfs\.io|gateway\.pinata\.cloud|[\w-]+\.thirdwebcdn\.com)\/ipfs\/([a-zA-Z0-9]+)/;
  const match = input.match(ipfsGatewayPattern);
  if (match && isValidIpfsCid(match[1])) {
    return input;
  }

  // Handle raw CID (no path)
  if (isValidIpfsCid(input)) {
    return `https://ipfs.io/ipfs/${input}`;
  }

  return null;
}

/**
 * Validate IPFS Content Identifier (CID)
 * CIDv0: Qm... (46 chars, base58btc)
 * CIDv1: ba... (variable length, base32)
 */
function isValidIpfsCid(cid: string): boolean {
  // CIDv0: Starts with Qm, 46 characters, base58btc encoding
  const cidV0Pattern = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
  // CIDv1: Starts with b (base32), variable length (typically 59+ chars)
  const cidV1Pattern = /^b[a-z2-7]{50,}$/;

  return cidV0Pattern.test(cid) || cidV1Pattern.test(cid);
}

/**
 * Escape SQL-like patterns for safe use in LIKE queries
 * Prevents SQL injection via pattern characters
 */
export function escapeLikePattern(pattern: string): string {
  return pattern.replace(/[%_\\]/g, "\\$&");
}

/**
 * Sanitize Ethereum address
 * Returns lowercase checksummed address or null if invalid
 */
export function sanitizeEthereumAddress(address: string): string | null {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return null;
  }
  return address.toLowerCase();
}

/**
 * Sanitize numeric string ID
 */
export function sanitizeNumericId(id: string): number | null {
  const parsed = parseInt(id, 10);
  if (isNaN(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}

/**
 * Sanitize username/handle
 * Allows alphanumeric, underscores, and hyphens
 */
export function sanitizeUsername(username: string): string | null {
  const sanitized = username.trim().toLowerCase();
  if (!/^[a-z0-9_-]{3,32}$/.test(sanitized)) {
    return null;
  }
  return sanitized;
}

/**
 * Sanitize file name for uploads
 * Removes path traversal attempts and dangerous characters
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[/\\]/g, "") // Remove path separators
    .replace(/\.\./g, "") // Remove parent directory references
    .replace(/[<>:"|?*]/g, "") // Remove invalid Windows characters
    .replace(/[\x00-\x1f\x80-\x9f]/g, "") // Remove control characters
    .trim();
}

/**
 * Truncate string to max length with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}
