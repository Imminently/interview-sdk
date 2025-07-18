// Types for the result object with discriminated union
type Success<T> = [null, T];

type Failure<E> = [E, null];

type Result<T, E = Error> = Success<T> | Failure<E>;

export const tryCatch = async <T, E extends Error = Error>(
	prom: Promise<T> | (() => Promise<T>),
): Promise<Result<T, E>> => {
	try {
		const data = await (typeof prom === "function" ? prom() : prom);
		return [null, data];
	} catch (error) {
		return [
			error instanceof Error ? (error as E) : (new Error("Unknown error") as E),
			null,
		];
	}
};
