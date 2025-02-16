import type { ParserOptions } from "@babel/parser";
import type { FilterPattern } from "unplugin-utils";
import * as t from "@babel/types";

export interface Options {
	/**
	 * The include pattern to match files
	 * @default ['.[jt]sx?$']
	 */
	include?: FilterPattern;
	exclude?: FilterPattern | undefined;
	enforce?: "post" | "pre" | undefined;
	parserOptions?: ParserOptions;

	/**
	 * The transform function to modify the file name used in the `attributes.at` option
	 */
	transformFileName?: (fileName: string, location: t.SourceLocation) => string;

	/**
	 * The attributes to add to the JSX element
	 * @default { at: 'data-at', in: 'data-in', kind: 'data-kind' }
	 */
	attributes?: {
		/**
		 * The attribute name to add for the `fileName:lineStart-lineEnd` location
		 * @default 'data-at'
		 * data-source="file.tsx:4-4"
		 */
		at?: string | false;
		/**
		 * The attribute name to add for the file location (only)
		 * @default false
		 *
		 * @example
		 * data-source="4-4"
		 */
		loc?: string | false;
		/**
		 * The attribute name to add for the wrapping component name
		 * @default 'data-in'
		 */
		in?: string | false;
		/**
		 * The attribute name to add for the component kind
		 * @default 'data-kind'
		 */
		kind?: string | false;
	};
}

type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U;

export type OptionsResolved = Overwrite<
	Required<Options>,
	{
		exclude: Options["exclude"];
		enforce: Options["enforce"];
		attributes: Required<Required<Options>["attributes"]>;
	}
>;

const defaultTransformFileName = (id: string, loc: t.SourceLocation) => {
	const fileName = id.split("/").pop() ?? "unknown";
	return `${fileName}:${loc.start.line}-${loc.end.line}`;
};

export function resolveOption(options: Options): OptionsResolved {
	return {
		include: options.include || [/\.[jt]sx?$/],
		exclude: options.exclude || undefined,
		enforce: options.enforce || undefined,
		parserOptions: options.parserOptions || {},
		transformFileName: options.transformFileName || defaultTransformFileName,
		attributes: {
			at: "data-at",
			loc: false,
			in: "data-in",
			kind: "data-kind",
			...options.attributes,
		},
	};
}
