declare module "bcryptjs" {
  export function hash(data: string | Buffer, saltOrRounds: number): Promise<string>
  export function compare(data: string | Buffer, encrypted: string): Promise<boolean>
}

declare module "jsonwebtoken" {
  export function sign(payload: string | object | Buffer, secretOrPrivateKey: string, options?: object): string
  export function verify(token: string, secretOrPrivateKey: string, options?: object): object | string
}

declare module "uuid" {
  export function v4(): string
}