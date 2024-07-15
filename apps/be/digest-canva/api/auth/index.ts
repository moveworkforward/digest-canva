import { CanvaClient } from "../../shared/services/canva";
import logger from "../../shared/logger";

export const handler = async (event: any) => {
    const { code, state } = event.queryStringParameters;
    try {
        const auth = await CanvaClient.register(code, state);

        if (!auth) {
            throw new Error("Something went wrong with the authentication process");
        }
        const params = new URLSearchParams({
            success: "true",
            state: auth.addonState,
        });
    
        return {
            statusCode: 302,
            headers: {
                Location: `https://www.canva.com/apps/configured?${params.toString()}`,
            },
        };
    } catch (error) {
        logger.error("Error in auth", error);
        const params = new URLSearchParams({
            success: "false",
            state,
        });
    
        return {
            statusCode: 302,
            headers: {
                Location: `https://www.canva.com/apps/configured?${params.toString()}`,
            },
        };
    } 
};