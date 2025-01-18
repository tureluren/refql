import Prop from ".";

function BooleanProp <As extends string>(as: As, col?: string): Prop<As, boolean> {
  return Prop (as, col as string | undefined);
}

export default BooleanProp;