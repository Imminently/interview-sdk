const { constructInputFromPreProcessed } = require("../manager");

describe("constructInputFromPreProcessed", () => {
	it("1. should construct input from empty preprocessed state", () => {
		const preProcessedState = require("./preProcessedState1.json");
		const data = { "@parent": undefined };
		const userValues = { name: "John", age: 30 };

		const result = constructInputFromPreProcessed(
			preProcessedState,
			data,
			userValues,
		);

		//require("fs").writeFileSync("./src/__tests__/preProcessedState1_result.json", JSON.stringify(result, null, 2));

		expect(result).toEqual(require("./preProcessedState1_result.json"));
	});
});
