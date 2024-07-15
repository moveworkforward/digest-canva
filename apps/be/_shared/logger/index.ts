/* eslint-disable @typescript-eslint/no-explicit-any */
interface LoggerConfiguration {
    obfuscateFields: string[];
    logLevel: number;
}

type Severity = "debug" | "info" | "error";

const severityToLogLevel = (severity: Severity) => {
    switch (severity.toLowerCase()) {
    case "debug":
        return 0;
    case "info":
        return 1;
    case "error":
        return 2;
    default:
        return 1;
    }
};

const defaultLoggerConfiguration = (): LoggerConfiguration => ({
    obfuscateFields: ["personalAccessToken", "pat", "password", "adoKey", "accessToken", "apiToken", "sharedSecret"],
    logLevel: severityToLogLevel(process.env.LOG_LEVEL as Severity || "info"),
});

const safeLog = (logOperation: () => void) => {
    try {
        logOperation();
    } catch (e) {
        console.error("And error occured during the log operation", e);
    }
};

const recomposeErrorObject = (value: any) => {
    if (value instanceof Error) {
        return {
            ...value,
            name: value.name,
            message: value.message,
            stack: value.stack,
            cause: (value as any).cause,
        };
    }
    return value;
};

export class Logger {
    constructor(private readonly _configuration: LoggerConfiguration = defaultLoggerConfiguration()) { }

    public debug(message?: any, ...optionalParams: any[]): void {
        if (this._configuration.logLevel > 0) {
            return;
        }
        safeLog(() => console.debug(message, ...optionalParams.map((param) => this.obfuscateObject(param))));
    }

    public info(message?: any, ...optionalParams: any[]): void {
        if (this._configuration.logLevel > 1) {
            return;
        }
        safeLog(() => console.info(message, ...optionalParams.map((param) => this.obfuscateObject(param))));
    }

    public error(message?: any, ...optionalParams: any[]): void {
        if (this._configuration.logLevel > 2) {
            return;
        }
        safeLog(() => console.error(message, ...optionalParams.map((param) => this.obfuscateObject(param))));
    }

    public json(format: string, data: any) {
        if (this._configuration.logLevel > 1) {
            return;
        }
        safeLog(() => console.info(format, JSON.stringify(this.obfuscateObject(data), null, 2)));
    }

    public jsonDebug(format: string, data: any) {
        if (this._configuration.logLevel > 1) {
            return;
        }
        safeLog(() => console.debug(format, JSON.stringify(this.obfuscateObject(data), null, 2)));
    }

    public jsonError(format: string, error: any) {
        if (this._configuration.logLevel > 2) {
            return;
        }
        safeLog(() => console.error(format, JSON.stringify(this.obfuscateObject(error), null, 2)));
    }

    private obfuscateField(value: string, key: string) {
        const lowerCaseKey = key.toLocaleLowerCase();
        const compare = (field: string) => lowerCaseKey.startsWith(field.toLocaleLowerCase());
        const shouldObfuscate = this._configuration.obfuscateFields.some(compare);
        return shouldObfuscate ? "*****" : recomposeErrorObject(value);
    }

    private obfuscateObject(data: any, circularRefs: WeakMap<any, any> = new WeakMap()) {
        if (data === null || data === undefined || typeof data !== "object") {
            return data;
        }

        if (circularRefs.has(data)) {
            // this will prevent JSON.serialize to fail miserably like it does now
            return "[[circular ref]]";
        }

        data = recomposeErrorObject(data);
        const newData = Array.isArray(data) ? [...data] : { ...data };
        circularRefs.set(data, newData);

        const keys = Object.getOwnPropertyNames(data);

        keys.forEach((key) => {
            newData[key] = typeof newData[key] === "string" ?
                this.obfuscateField(newData[key], key) :
                this.obfuscateObject(newData[key], circularRefs);
        });

        return newData;
    }
}

const logger = new Logger();
export default logger;
export { logger };
