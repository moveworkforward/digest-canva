// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Canva {
  export interface CanvaAuth {
    state: string;
    codeVerifier: string;
    ttl: number;
  }

  export interface CanvaUser {
    email: string;
  }
}