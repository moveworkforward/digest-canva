process.env.LOG_LEVEL = "debug";
import { logger, Logger } from "../index";

describe("Logger", () => {
    let consoleLogSpy: jest.SpyInstance;
    let consoleDebugSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    
    beforeEach(() => {
        consoleLogSpy = jest.spyOn(console, "info").mockImplementation();
        consoleDebugSpy = jest.spyOn(console, "debug").mockImplementation();
        consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleDebugSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    it("should log debug messages with obfuscated fields", () => {
        logger.debug("Debug message", {
            personalAccessToken: "123456789",
            password: "password123",
        });

        expect(consoleDebugSpy).toHaveBeenCalledWith("Debug message", {
            personalAccessToken: "*****",
            password: "*****",
        });
    });

    it("should respect debug logLevel", () => {
        process.env.LOG_LEVEL = "debug";
        const logger = new Logger();
        logger.debug("Debug message");
        logger.info("Info message");
        logger.error("Error message");

        expect(consoleDebugSpy).toHaveBeenCalledWith("Debug message");
        expect(consoleLogSpy).toHaveBeenCalledWith("Info message");
        expect(consoleErrorSpy).toHaveBeenCalledWith("Error message");
    });

    it("should respect info logLevel", () => {
        process.env.LOG_LEVEL = "info";
        const logger = new Logger();
        logger.debug("Debug message");
        logger.info("Info message");
        logger.error("Error message");

        expect(consoleDebugSpy).not.toHaveBeenCalled();
        expect(consoleLogSpy).toHaveBeenCalledWith("Info message");
        expect(consoleErrorSpy).toHaveBeenCalledWith("Error message");
    });

    it("should respect error logLevel", () => {
        process.env.LOG_LEVEL = "error";
        const logger = new Logger();
        logger.debug("Debug message");
        logger.info("Info message");
        logger.error("Error message");

        expect(consoleDebugSpy).not.toHaveBeenCalled();
        expect(consoleLogSpy).not.toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalledWith("Error message");
    });

    it("should log info messages with obfuscated fields", () => {
        logger.info("Info message", {
            personalAccessToken: "987654321",
            username: "john.doe",
        });

        expect(consoleLogSpy).toHaveBeenCalledWith("Info message", {
            personalAccessToken: "*****",
            username: "john.doe",
        });
    });

    it("should log error messages with obfuscated fields", () => {
        logger.error("Error message", {
            personalAccessToken: "qwertyuiop",
            email: "test@example.com",
        });

        expect(consoleErrorSpy).toHaveBeenCalledWith("Error message", {
            personalAccessToken: "*****",
            email: "test@example.com",
        });
    });


    it("should log JSON debug with obfuscated fields", () => {
        const error = new Error("Something went wrong");
        error.stack = "Fake Stack Trace";
        logger.jsonDebug("Debug:", { personalAccessToken: "asdfghjkl", error });

        expect(consoleDebugSpy).toHaveBeenCalledWith(
            "Debug:",
            JSON.stringify({ personalAccessToken: "*****", error: {
                "name": "Error",
                "message": "Something went wrong",
                "stack": "Fake Stack Trace",
            } }, null, 2)
        );
    });

    it("should log JSON error with obfuscated fields", () => {
        const error = new Error("Something went wrong");
        error.stack = "Fake Stack Trace";
        logger.jsonError("Error:", { personalAccessToken: "asdfghjkl", error });

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            "Error:",
            JSON.stringify({ personalAccessToken: "*****", error: {
                "name": "Error",
                "message": "Something went wrong",
                "stack": "Fake Stack Trace",
            } }, null, 2)
        );
    });

    it("should log thrown Error objects", () => {
        const error = new Error("Something went wrong");
        error.stack = "Fake Stack Trace";
        logger.error("Error:", error);
        
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            "Error:",
            // eslint-disable-next-line quotes
            { "cause": undefined, "message": "Something went wrong", "name": "Error", "stack": "Fake Stack Trace" }
        );
    });

    it("should log custom error with obfuscated fields", () => {
        class CustomError extends Error {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            private personalAccessToken: string;
            // eslint-disable-next-line @typescript-eslint/naming-convention
            private msg: string;
            constructor(message: string, accessToken: string) {
                super(message);
                this.msg = message;
                this.personalAccessToken = accessToken;
            }
            toJson() {
                return {
                    message: this.msg,
                    personalAccessToken: this.personalAccessToken,
                };
            }
        }
        const error = new CustomError("failed", "asdfghjkl");
        error.stack = "Fake Stack Trace";
        logger.error("Error:", error);
        
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            "Error:",
            { "cause": undefined, "message": "failed", "msg": "failed", "name": "Error", "personalAccessToken": "*****", "stack": "Fake Stack Trace" }
        );
    });

    it("should log JSON custom error with obfuscated fields", () => {
        class CustomError extends Error {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            private personalAccessToken: string;
            // eslint-disable-next-line @typescript-eslint/naming-convention
            private msg: string;
            constructor(message: string, accessToken: string) {
                super(message);
                this.msg = message;
                this.personalAccessToken = accessToken;
            }
            toJson() {
                return {
                    message: this.msg,
                    personalAccessToken: this.personalAccessToken,
                };
            }
        }
        const error = new CustomError("failed", "asdfghjkl");
        error.stack = "Fake Stack Trace";
        logger.jsonError("Error:", error);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            "Error:",
            JSON.stringify({ msg: "failed", personalAccessToken: "*****", name: "Error", message: "failed", stack: "Fake Stack Trace" }, null, 2)
        );
    });

    it("should log JSON data with obfuscated fields", () => {
        const data = { personalAccessToken: "zxcvbnm", username: "jane.doe" };
        logger.json("Data:", data);

        expect(consoleLogSpy).toHaveBeenCalledWith(
            "Data:",
            JSON.stringify({ personalAccessToken: "*****", username: "jane.doe" }, null, 2)
        );
    });

    it("should handle circularRef", () => {
        const objectToLog = {
            name: "user",
            collection: [1, 2, {}],
        };
        objectToLog.collection.push(objectToLog);

        logger.debug("Debug message", objectToLog);

        logger.info("Info message", {
            personalAccessToken: "987654321",
            ...objectToLog,
        });
        logger.error("Error message", {
            personalAccessToken: "qwertyuiop",
            ...objectToLog,
        });

        logger.jsonError("Error:", { personalAccessToken: "asdfghjkl", ...objectToLog });
        logger.json("Data:", { personalAccessToken: "zxcvbnm", ...objectToLog });

        expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
        expect(consoleLogSpy).toHaveBeenCalledTimes(2);

        expect(consoleDebugSpy).toHaveBeenNthCalledWith(1, "Debug message", {
            "name": "user",
            "collection": [
                1,
                2,
                {},
                "[[circular ref]]",
            ],
        });

        expect(consoleLogSpy).toHaveBeenNthCalledWith(1, "Info message", {
            personalAccessToken: "*****",
            name: "user",
            collection: [
                1,
                2,
                {},
                {
                    "name": "user",
                    "collection": "[[circular ref]]",
                },
            ],
        });

        expect(consoleLogSpy).toHaveBeenNthCalledWith(2, "Data:", JSON.stringify({
            personalAccessToken: "*****",
            name: "user",
            collection: [
                1,
                2,
                {},
                {
                    name: "user",
                    collection: "[[circular ref]]",
                },
            ],
        }, null, 2));

        expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
        expect(consoleErrorSpy).toHaveBeenNthCalledWith(1, "Error message", {
            personalAccessToken: "*****",
            name: "user",
            "collection": [
                1,
                2,
                {},
                {
                    "name": "user",
                    "collection": "[[circular ref]]",
                },
            ],
        });

        expect(consoleErrorSpy).toHaveBeenNthCalledWith(2, "Error:", JSON.stringify({
            personalAccessToken: "*****",
            name: "user",
            "collection": [
                1,
                2,
                {},
                {
                    "name": "user",
                    "collection": "[[circular ref]]",
                },
            ],
        }, null, 2));
    });
});
