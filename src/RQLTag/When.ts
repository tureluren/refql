import { refqlType } from "../common/consts";
import { Params, TagFunctionVariable } from "../common/types";
import RQLNode, { rqlNodePrototype } from "./RQLNode";
import SelectableType, { isSelectableType, selectableTypePrototype } from "../Table/SelectableType";
// WHEN ZOU EIG GWN EEN pred en een RQLTag moeten krijgen, of nie ? (want refnodes zijn nie mogelijk)

// still A selectable type ?
interface When<Components extends SelectableType[] = any[]> extends RQLNode, SelectableType {
  params: Partial<Params<{}, Components>>;
  pred: TagFunctionVariable<Partial<Params<{}, Components>>, boolean>;
  components: Components;
}

const type = "refql/When";

const prototype = Object.assign ({}, rqlNodePrototype, selectableTypePrototype, {
  constructor: When,
  [refqlType]: type
});

// Components is inferred from type of `tag` parameter, so no need to default it to any
function When<Components extends SelectableType[]>(pred: TagFunctionVariable<Partial<Params<{}, Components>>, boolean>, components: Components) {
  let when: When<Components> = Object.create (prototype);

  const whenComponents = components.flatMap (comp => {
    if (!isSelectableType (comp)) {
      throw new Error ("Unallowed component provided to When");
    }

    if (When.isWhen (comp)) {
      return comp.components.map (comp2 =>
        comp2.setPred ((p: any) => comp2.pred (p) && pred (p))
      );
    }

    return comp.setPred (pred);
  });

  when.pred = pred;
  when.components = whenComponents as Components;

  return when;
}

When.isWhen = function <Components extends SelectableType[] = any[]> (x: any): x is When<Components> {
  return x != null && x[refqlType] === type;
};

export default When;