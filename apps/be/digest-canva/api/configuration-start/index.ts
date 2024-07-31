import * as crypto from "crypto";
import { logger } from "../../shared/logger";
const COOKIE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export const handler = async (event: any) => {
    logger.json("Configuration start event", event);

    const nonce = crypto.randomUUID();
    // Set the expiry time for the nonce. We recommend 5 minutes.
    const expiry = Date.now() + COOKIE_EXPIRY_MS;

    // Create a JSON string that contains the nonce and an expiry time
    const nonceWithExpiry = JSON.stringify([nonce, expiry]);

    // Create the query parameters that Canva requires
    const params = new URLSearchParams({
        nonce,
        state: event?.queryStringParameters?.state || "",
    });

    return {
        statusCode: 302,
        headers: {
            Location: `https://canva.com/apps/configure/link?${params.toString()}`,
            Cookie: `nonce=${encodeURIComponent(nonceWithExpiry)}; Secure; HttpOnly; Max-Age=${COOKIE_EXPIRY_MS / 1000};`,
        },
    };
};