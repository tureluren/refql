import Plurlizer from "./Pluralizer";

const pluralizer = new Plurlizer (true, {});

const begin = performance.now ();

const plural = pluralizer.toPlural ("baby");

const end = performance.now ();

console.log ("performance: total " + (end - begin));

console.log (plural);