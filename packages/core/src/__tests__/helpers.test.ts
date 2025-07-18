import { replaceTemplatedText } from "../helpers";
import type { AttributeData, Session, State } from "../types";

describe("replaceTemplatedText", () => {
	describe("date formatting", () => {
		it("should not modify time that is already in correct format", () => {
			// Test case for {{attribute | date h:mm a}} where input is already "5:12 am"
			const text = "The time is {{time | date h:mm a}}";
			const replacements = { time: "5:12 am" };
			const data = { "@parent": undefined } as Record<string, AttributeData> & {
				"@parent": string | undefined;
			};
			const state: State[] = [
				{
					id: "time",
					value: "5:12 am",
					type: "time",
					dependencies: [],
				},
			];
			const locale = "en-au";

			const result = replaceTemplatedText(
				text,
				replacements,
				data,
				state,
				locale,
			);

			// The time should remain unchanged since it's already in the correct format
			expect(result).toBe("The time is 5:12 am");
		});

		it("should not modify PM time that is already in correct format", () => {
			// Test case for {{attribute | date h:mm a}} where input is already "5:30 pm"
			const text = "The time is {{time | date h:mm a}}";
			const replacements = { time: "5:30 pm" };
			const data = { "@parent": undefined } as Record<string, AttributeData> & {
				"@parent": string | undefined;
			};
			const state: State[] = [
				{
					id: "time",
					value: "5:30 pm",
					type: "time",
					dependencies: [],
				},
			];
			const locale = "en-au";

			const result = replaceTemplatedText(
				text,
				replacements,
				data,
				state,
				locale,
			);

			// The time should remain unchanged since it's already in the correct format
			expect(result).toBe("The time is 5:30 pm");
		});

		it("should not modify midnight time that is already in correct format", () => {
			// Test case for {{attribute | date h:mm a}} where input is already "12:00 am"
			const text = "The time is {{time | date h:mm a}}";
			const replacements = { time: "12:00 am" };
			const data = { "@parent": undefined } as Record<string, AttributeData> & {
				"@parent": string | undefined;
			};
			const state: State[] = [
				{
					id: "time",
					value: "12:00 am",
					type: "time",
					dependencies: [],
				},
			];
			const locale = "en-au";

			const result = replaceTemplatedText(
				text,
				replacements,
				data,
				state,
				locale,
			);

			// The time should remain unchanged since it's already in the correct format
			expect(result).toBe("The time is 12:00 am");
		});

		it("should not modify noon time that is already in correct format", () => {
			// Test case for {{attribute | date h:mm a}} where input is already "12:00 pm"
			const text = "The time is {{time | date h:mm a}}";
			const replacements = { time: "12:00 pm" };
			const data = { "@parent": undefined } as Record<string, AttributeData> & {
				"@parent": string | undefined;
			};
			const state: State[] = [
				{
					id: "time",
					value: "12:00 pm",
					type: "time",
					dependencies: [],
				},
			];
			const locale = "en-au";

			const result = replaceTemplatedText(
				text,
				replacements,
				data,
				state,
				locale,
			);

			// The time should remain unchanged since it's already in the correct format
			expect(result).toBe("The time is 12:00 pm");
		});

		it('should format date with "h:mm a" format correctly for UTC time', () => {
			// Test case for {{attribute | date h:mm a}} where input is "5:12 am" in UTC
			const text = "The time is {{time | date h:mm a}}";
			const replacements = { time: "2024-01-15T05:12:00Z" }; // UTC time
			const data = { "@parent": undefined } as Record<string, AttributeData> & {
				"@parent": string | undefined;
			};
			const state: State[] = [
				{
					id: "time",
					value: "2024-01-15T05:12:00Z",
					type: "datetime",
					dependencies: [],
				},
			];
			const locale = "en-au";

			const result = replaceTemplatedText(
				text,
				replacements,
				data,
				state,
				locale,
			);

			// The expected result should be "5:12 AM" in UTC (date-fns uses uppercase AM/PM)
			expect(result).toBe("The time is 5:12 AM");
		});

		it('should format date with "h:mm a" format for different UTC time formats', () => {
			const text = "The time is {{time | date h:mm a}}";
			const replacements = { time: "2024-01-15T05:12:00.000Z" }; // UTC with milliseconds
			const data = { "@parent": undefined } as Record<string, AttributeData> & {
				"@parent": string | undefined;
			};
			const state: State[] = [
				{
					id: "time",
					value: "2024-01-15T05:12:00.000Z",
					type: "datetime",
					dependencies: [],
				},
			];
			const locale = "en-au";

			const result = replaceTemplatedText(
				text,
				replacements,
				data,
				state,
				locale,
			);

			// Should format the UTC datetime to "5:12 AM"
			expect(result).toBe("The time is 5:12 AM");
		});

		it("should handle PM times correctly in UTC", () => {
			const text = "The time is {{time | date h:mm a}}";
			const replacements = { time: "2024-01-15T17:30:00Z" }; // UTC PM time
			const data = { "@parent": undefined } as Record<string, AttributeData> & {
				"@parent": string | undefined;
			};
			const state: State[] = [
				{
					id: "time",
					value: "2024-01-15T17:30:00Z",
					type: "datetime",
					dependencies: [],
				},
			];
			const locale = "en-au";

			const result = replaceTemplatedText(
				text,
				replacements,
				data,
				state,
				locale,
			);

			// Should format the UTC datetime to "5:30 PM"
			expect(result).toBe("The time is 5:30 PM");
		});

		it("should handle midnight correctly in UTC", () => {
			const text = "The time is {{time | date h:mm a}}";
			const replacements = { time: "2024-01-15T00:00:00Z" }; // UTC midnight
			const data = { "@parent": undefined } as Record<string, AttributeData> & {
				"@parent": string | undefined;
			};
			const state: State[] = [
				{
					id: "time",
					value: "2024-01-15T00:00:00Z",
					type: "datetime",
					dependencies: [],
				},
			];
			const locale = "en-au";

			const result = replaceTemplatedText(
				text,
				replacements,
				data,
				state,
				locale,
			);

			// Should format the UTC datetime to "12:00 AM"
			expect(result).toBe("The time is 12:00 AM");
		});

		it("should handle noon correctly in UTC", () => {
			const text = "The time is {{time | date h:mm a}}";
			const replacements = { time: "2024-01-15T12:00:00Z" }; // UTC noon
			const data = { "@parent": undefined } as Record<string, AttributeData> & {
				"@parent": string | undefined;
			};
			const state: State[] = [
				{
					id: "time",
					value: "2024-01-15T12:00:00Z",
					type: "datetime",
					dependencies: [],
				},
			];
			const locale = "en-au";

			const result = replaceTemplatedText(
				text,
				replacements,
				data,
				state,
				locale,
			);

			// Should format the UTC datetime to "12:00 PM"
			expect(result).toBe("The time is 12:00 PM");
		});

		it("should handle edge case: 11:59 PM UTC", () => {
			const text = "The time is {{time | date h:mm a}}";
			const replacements = { time: "2024-01-15T23:59:00Z" }; // UTC 11:59 PM
			const data = { "@parent": undefined } as Record<string, AttributeData> & {
				"@parent": string | undefined;
			};
			const state: State[] = [
				{
					id: "time",
					value: "2024-01-15T23:59:00Z",
					type: "datetime",
					dependencies: [],
				},
			];
			const locale = "en-au";

			const result = replaceTemplatedText(
				text,
				replacements,
				data,
				state,
				locale,
			);

			// Should format the UTC datetime to "11:59 PM"
			expect(result).toBe("The time is 11:59 PM");
		});

		it("should handle edge case: 12:01 AM UTC", () => {
			const text = "The time is {{time | date h:mm a}}";
			const replacements = { time: "2024-01-15T00:01:00Z" }; // UTC 12:01 AM
			const data = { "@parent": undefined } as Record<string, AttributeData> & {
				"@parent": string | undefined;
			};
			const state: State[] = [
				{
					id: "time",
					value: "2024-01-15T00:01:00Z",
					type: "datetime",
					dependencies: [],
				},
			];
			const locale = "en-au";

			const result = replaceTemplatedText(
				text,
				replacements,
				data,
				state,
				locale,
			);

			// Should format the UTC datetime to "12:01 AM"
			expect(result).toBe("The time is 12:01 AM");
		});

		it('should return "..." when value is not found', () => {
			const text = "The time is {{nonexistent | date h:mm a}}";
			const replacements = {};
			const data = { "@parent": undefined } as Record<string, AttributeData> & {
				"@parent": string | undefined;
			};
			const state: State[] = [];
			const locale = "en-au";

			const result = replaceTemplatedText(
				text,
				replacements,
				data,
				state,
				locale,
			);

			expect(result).toBe("The time is ...");
		});

		it("should handle parent scoped attributes with UTC time", () => {
			const text = "The time is {{parent/time | date h:mm a}}";
			const replacements = { time: "2024-01-15T05:12:00Z" }; // UTC time
			const data = { "@parent": "parent" } as Record<string, AttributeData> & {
				"@parent": string | undefined;
			};
			const state: State[] = [
				{
					id: "time",
					value: "2024-01-15T05:12:00Z",
					type: "datetime",
					dependencies: [],
				},
			];
			const locale = "en-au";

			const result = replaceTemplatedText(
				text,
				replacements,
				data,
				state,
				locale,
			);

			expect(result).toBe("The time is 5:12 AM");
		});
	});
});
