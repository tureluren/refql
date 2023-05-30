import truePred from "../common/truePred.ts";

const SelectableTypeSymbol: unique symbol = Symbol ("@@SelectableType");

interface SelectableType {
  [SelectableTypeSymbol]: true;
  pred(p: any): boolean;
  setPred (fn: (p: any) => boolean): SelectableType;
  precedence: number;
}

export const selectableTypePrototype = {
  [SelectableTypeSymbol]: true,
  pred: truePred
};

export const isSelectableType = function (x: any): x is SelectableType {
  return x != null && !!x[SelectableTypeSymbol];
};

export default SelectableType;