const PropTypeSymbol: unique symbol = Symbol ("@@PropType");

interface PropType<As extends string> {
  as: As;
  [PropTypeSymbol]: true;
}

export const propTypePrototype = {
  [PropTypeSymbol]: true
};

export default PropType;