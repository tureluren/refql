const SelectableTypeSymbol: unique symbol = Symbol ("@@SelectableType");

interface SelectableType {
  [SelectableTypeSymbol]: true;
}

export const selectableTypePrototype = {
  [SelectableTypeSymbol]: true
};

export default SelectableType;