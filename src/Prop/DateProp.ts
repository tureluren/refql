import Prop from ".";

function DateProp <As extends string>(as: As, col?: string): Prop<As, Date> {
  return Prop (as, col as string | undefined);
}

export default DateProp;