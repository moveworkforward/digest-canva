import { generateAccessToken } from "../../shared/services/canva";
import logger from "../../shared/logger";

export const handler = async (event: any) => {
    logger.json("Auth event", event);

    const { code, state } = event.query;
    try {
        const tokenResponse = await generateAccessToken(code, state);
        logger.json("Token response", tokenResponse);
        return `
            <!DOCTYPE html>
            <html>
              <head>
                <script  type="text/javascript">
                    window.opener.postMessage({ status: "success" }, '*');
                    window.close();
                </script>
              </head>
              <body>
                <p>Handling OAuth response...</p>
              </body>
            </html>
          `;
    } catch (error) {
        logger.error("Get azure auth code event - ERROR: ", error);
        return `
          <!DOCTYPE html>
          <html>
            <head>
            </head>
            <body>
              <p>Something went wrong...</p>
            </body>
          </html>
        `;
    } 
};