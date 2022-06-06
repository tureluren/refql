import Pluralizer from ".";

describe ("Pluralizer type", () => {
  test ("create Pluralizer", () => {
    const plurals = {};
    const pluralizer = new Pluralizer (true, plurals);

    expect (pluralizer.pluralize).toBe (true);
    expect (pluralizer.plurals).toBe (plurals);
  });

  test ("selfprovided plural", () => {
    const pluralizer = new Pluralizer (true, { echo: "echoes" });

    expect (pluralizer.toPlural ("echo")).toBe ("echoes");
  });

  test ("keep casing of last char", () => {
    const pluralizer = new Pluralizer (true, {});

    expect (pluralizer.toPlural ("photo")).toBe ("photos");
    expect (pluralizer.toPlural ("phoTO")).toBe ("phoTOS");
  });

  test ("plural ends in ''", () => {
    const pluralizer = new Pluralizer (true, {});

    expect (pluralizer.toPlural ("deer")).toBe ("deer");
    expect (pluralizer.toPlural ("fish")).toBe ("fish");
    expect (pluralizer.toPlural ("cheese")).toBe ("cheese");
  });

  test ("plural ends in 'es'", () => {
    const pluralizer = new Pluralizer (true, {});

    expect (pluralizer.toPlural ("analysis")).toBe ("analyses");
    expect (pluralizer.toPlural ("axis")).toBe ("axes");
    expect (pluralizer.toPlural ("church")).toBe ("churches");
    expect (pluralizer.toPlural ("rush")).toBe ("rushes");
    expect (pluralizer.toPlural ("cross")).toBe ("crosses");
    expect (pluralizer.toPlural ("box")).toBe ("boxes");
    expect (pluralizer.toPlural ("buzz")).toBe ("buzzes");
    expect (pluralizer.toPlural ("status")).toBe ("statuses");
    expect (pluralizer.toPlural ("alias")).toBe ("aliases");
    expect (pluralizer.toPlural ("teargas")).toBe ("teargases");
    expect (pluralizer.toPlural ("iris")).toBe ("irises");
  });

  test ("plural ends in 'ves'", () => {
    const pluralizer = new Pluralizer (true, {});

    expect (pluralizer.toPlural ("scalf")).toBe ("scalves");
    expect (pluralizer.toPlural ("elf")).toBe ("elves");
    expect (pluralizer.toPlural ("wolf")).toBe ("wolves");
    expect (pluralizer.toPlural ("knife")).toBe ("knives");
    expect (pluralizer.toPlural ("life")).toBe ("lives");
    expect (pluralizer.toPlural ("wife")).toBe ("wives");
    expect (pluralizer.toPlural ("leaf")).toBe ("leaves");
  });

  test ("plural ends in 's'", () => {
    const pluralizer = new Pluralizer (true, {});

    expect (pluralizer.toPlural ("way")).toBe ("ways");
    expect (pluralizer.toPlural ("key")).toBe ("keys");
    expect (pluralizer.toPlural ("toy")).toBe ("toys");
    expect (pluralizer.toPlural ("buy")).toBe ("buys");
  });

  test ("plural ends in 'ies'", () => {
    const pluralizer = new Pluralizer (true, {});

    expect (pluralizer.toPlural ("body")).toBe ("bodies");
    expect (pluralizer.toPlural ("baby")).toBe ("babies");
  });

  test ("plural ends in 'children'", () => {
    const pluralizer = new Pluralizer (true, {});

    expect (pluralizer.toPlural ("child")).toBe ("children");
  });

  test ("plural ends in 'men'", () => {
    const pluralizer = new Pluralizer (true, {});

    expect (pluralizer.toPlural ("man")).toBe ("men");
  });

  test ("plural ends in 'people'", () => {
    const pluralizer = new Pluralizer (true, {});

    expect (pluralizer.toPlural ("person")).toBe ("people");
  });
});