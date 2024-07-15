/* eslint-disable @typescript-eslint/no-namespace */
export type StageType = "prod" | "test" | "dev" | "local" | "personal";

export enum Stage {
    Prod = "prod",
    Test = "test",
    Dev = "dev",
    Local = "local",
    Personal = "personal",
}

export const domainName: Record<StageType, string> = {
    dev: "gudrunbot.com",
    test: "mwf-test.com",
    prod: "moveworkforward.net",
    local: "localhost",
    personal: "localhost",
};