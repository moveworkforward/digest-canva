import { CanvaClient } from "../../shared/services/canva";
import { verifyJwt } from "../../shared/services/jwt-verifier";

export const handler = async (event: any) => {
    const { canva_user_token: canvaUserToken, state, nonce } = event.queryStringParameters;

    const verified = await verifyJwt(canvaUserToken);

    const loginUrl = await CanvaClient.generateLoginUrl({ addonUserId: verified.userId, addonState: state, nonce });
    return {
        statusCode: 302,
        headers: {
            Location: loginUrl,
        },
    };
};