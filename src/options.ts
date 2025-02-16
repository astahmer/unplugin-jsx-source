import type { ParserOptions } from "@babel/parser";
import type { FilterPattern } from "unplugin-utils";

export interface Options {
	include?: FilterPattern;
	exclude?: FilterPattern | undefined;
	enforce?: "post" | "pre" | undefined;
	parserOptions?: ParserOptions;
}

type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U;

export type OptionsResolved = Overwrite<
	Required<Options>,
	{
		exclude: Options["exclude"];
		enforce: Options["enforce"];
	}
>;

export function resolveOption(options: Options): OptionsResolved {
	return {
		include: options.include || [/\.[jt]sx?$/],
		exclude: options.exclude || undefined,
		enforce: options.enforce || undefined,
		parserOptions: options.parserOptions || {},
	};
}
