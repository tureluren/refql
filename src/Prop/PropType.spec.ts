import Prop from ".";
import { sqlX } from "../SQLTag/sql";
import BelongsTo from "./BelongsTo";
import BelongsToMany from "./BelongsToMany";
import BooleanProp from "./BooleanProp";
import DateProp from "./DateProp";
import HasMany from "./HasMany";
import HasOne from "./HasOne";
import NumberProp from "./NumberProp";
import RefProp from "./RefProp";
import StringProp from "./StringProp";

describe ("Proptypes", () => {
  test ("NumberProp", () => {
    expect (Prop.isProp (NumberProp ("id"))).toBe (true);
    expect (Prop.isProp (NumberProp ("id", sqlX`id`))).toBe (false);
  });

  test ("StringProp", () => {
    expect (Prop.isProp (StringProp ("lastName", "last_name"))).toBe (true);
    expect (Prop.isProp (StringProp ("lastName", sqlX`last_name`))).toBe (false);
  });

  test ("DateProp", () => {
    expect (Prop.isProp (DateProp ("birthday"))).toBe (true);
    expect (Prop.isProp (DateProp ("birthday", sqlX`birthday`))).toBe (false);
  });

  test ("BooleanProp", () => {
    expect (Prop.isProp (BooleanProp ("ownGoal", "own_goal"))).toBe (true);
    expect (Prop.isProp (BooleanProp ("ownGoal", sqlX`own_goal`))).toBe (false);
  });

  test ("BelongsTo", () => {
    expect (RefProp.isRefProp (BelongsTo ("team", "public.team"))).toBe (true);
  });

  test ("BelongsToMany", () => {
    expect (RefProp.isRefProp (BelongsToMany ("games", "public.game"))).toBe (true);
  });

  test ("HasMany", () => {
    expect (RefProp.isRefProp (HasMany ("goals", "public.goal"))).toBe (true);
  });

  test ("HasOne", () => {
    expect (RefProp.isRefProp (HasOne ("rating", "public.rating"))).toBe (true);
  });
});