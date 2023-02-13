export interface URItoKind<A> {
  readonly Promise: Promise<A>;
}

export type URIS = keyof URItoKind<any>;

export type Kind<URI extends URIS, A> = URI extends URIS ? URItoKind<A>[URI] : any;