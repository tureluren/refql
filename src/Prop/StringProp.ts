import Prop from ".";

function StringProp <As extends string>(as: As, col?: string): Prop<As, string> {
  return Prop (as, col as string | undefined);
}

export default StringProp;