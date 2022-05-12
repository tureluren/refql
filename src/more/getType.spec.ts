// @ts-nocheck
import Environment from "../Environment";
import JBOInterpreter from "../JBOInterpreter";
import Parser from "../Parser";
import Table from "../Table";
import Tokenizer from "../Tokenizer";
import Raw from "../Raw";
import RQLTag from "../RQLTag";
import Rel from "../Rel";
import SQLTag from "../SQLTag";
import Sub from "../Sub";
import rql from "../RQLTag";
import getType from "./getType";

describe ("more `getType` - returns the type of a given structure", () => {
  test ("type returned", () => {
    expect (getType (Table ("player", "p"))).toBe ("Table");
    expect (getType (Tokenizer ())).toBe ("Tokenizer");
    expect (getType (Raw ("select id"))).toBe ("Raw");
    expect (getType (Parser ())).toBe ("Parser");
    expect (getType (Environment ())).toBe ("Environment");
    expect (getType (JBOInterpreter ())).toBe ("JBOInterpreter");
    expect (getType (SQLTag ())).toBe ("SQLTag");
    expect (getType (RQLTag ())).toBe ("RQLTag");
    expect (getType (Rel ("-") (rql`team { id name }`))).toBe ("Rel");
    expect (getType (Sub ())).toBe ("Sub");
  });
});