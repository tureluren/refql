import Plurlizer from "./Pluralizer";

const pluralizer = new Plurlizer (true, {});

const begin = performance.now ();

const plural = pluralizer.toPlural ("photo");

const end = performance.now ();

console.log (plural);

console.log ("performance: total " + (end - begin));