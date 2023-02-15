export interface BoxRegistry<Output> {
  readonly Promise: Promise<Output>;
}

export type Boxes = keyof BoxRegistry<any>;

export type Kind<Box extends Boxes, Output> = Box extends Boxes ? BoxRegistry<Output>[Box] : any;