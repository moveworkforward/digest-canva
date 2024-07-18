import { CanvaClient } from "../../shared/services/canva";
import logger from "../../shared/logger";

export const handler = async (event: any) => {
    logger.json("Auth event", event);

    const { code, state } = event.query;
    try {
        const user = await CanvaClient.register(code, state);

        if (!user) {
            throw new Error("User not found");
        }

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