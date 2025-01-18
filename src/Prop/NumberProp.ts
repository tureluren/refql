import Prop from ".";

function NumberProp <As extends string>(as: As, col?: string): Prop<As, number> {
  return Prop (as, col as string | undefined);
}

export default NumberProp;