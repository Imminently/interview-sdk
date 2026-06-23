const { constructInputFromPreProcessed } = require("../dynamic/constructInput");

describe("constructInputFromPreProcessed", () => {
  it("1. should construct input from empty preprocessed state", () => {
    const preProcessedState = require("./preProcessedState1.json");
    const data = { "@parent": undefined };
    const userValues = { name: "John", age: 30 };

    const result = constructInputFromPreProcessed(preProcessedState, data, userValues);

    //require("fs").writeFileSync("./src/__tests__/preProcessedState1_result.json", JSON.stringify(result, null, 2));

    expect(result).toEqual(require("./preProcessedState1_result.json"));
  });

  it("2. should merge slash-keyed userValues into the correct nested entity array items", () => {
    // Reproduces a bug where userValues like "industries/1/guid": true were being
    // assigned as flat top-level keys instead of being resolved into the industries array.
    const GUID = "be8ccd4d-917d-4fbc-9eaf-c0e9b2e3498a";

    const existingData = {
      industries: [
        { "@id": "1", [GUID]: false, name: "Children's services" },
        { "@id": "2", [GUID]: false, name: "School education" },
      ],
    };

    const data = { "@parent": undefined };

    const userValues = {
      [`industries/1/${GUID}`]: true,
      [`industries/2/${GUID}`]: false,
    };

    const result = constructInputFromPreProcessed(null, data, userValues, existingData);

    // The updated boolean should be merged into the correct array item
    expect(result.industries[0][GUID]).toBe(true);
    expect(result.industries[1][GUID]).toBe(false);

    // Slash-keyed paths must NOT appear as top-level properties
    expect(result[`industries/1/${GUID}`]).toBeUndefined();
    expect(result[`industries/2/${GUID}`]).toBeUndefined();
  });
});
