import jwt from "jsonwebtoken";
import { JwksClient } from "jwks-rsa";

const CACHE_EXPIRY_MS = 60 * 60 * 1_000; // 60 minutes
const TIMEOUT_MS = 30 * 1_000; // 30 seconds

const CANVA_APP_ID = process.env.CANVA_APP_ID as string;

async function getActivePublicKey({
    appId,
    token,
    cacheExpiryMs = CACHE_EXPIRY_MS,
    timeoutMs = TIMEOUT_MS,
}: {
  appId: string;
  token: string;
  cacheExpiryMs?: number;
  timeoutMs?: number;
}) {
    const decoded = jwt.decode(token, {
        complete: true,
    }) as { header: { kid: string } };

    const jwks = new JwksClient({
        cache: true,
        cacheMaxAge: cacheExpiryMs,
        timeout: timeoutMs,
        rateLimit: true,
        jwksUri: `https://api.canva.com/rest/v1/apps/${appId}/jwks`,
    });

    const key = await jwks.getSigningKey(decoded?.header?.kid);
    return key.getPublicKey();
}


export const verifyJwt = async (token: string) => {
    const publicKey = await getActivePublicKey({
        appId: CANVA_APP_ID,
        token,
    });

    const verified = jwt.verify(token, publicKey, {
        audience: CANVA_APP_ID,
    }) as { aud: string; userId: string };


    if (!verified.aud || !verified.userId) {
        throw new Error("The design token is not valid");
    }
    return verified;
};
