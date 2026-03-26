import type { ParserOptions as OxcParserOptions } from "oxc-parser";
import type { FilterPattern } from "unplugin-utils";

/** Location shape passed to `transformFileName` (line/column match Babel-style `SourceLocation`). */
export interface SourceLocation {
	start: { line: number; column: number };
	end: { line: number; column: number };
}

export interface Options {
	/**
	 * The include pattern to match files
	 * @default ['.[jt]sx?$']
	 */
	include?: FilterPattern;
	exclude?: FilterPattern | undefined;
	/** @default "pre" */
	enforce?: "post" | "pre" | undefined;
	/** Options passed to `oxc-parser` `parseSync` (see [ParserOptions](https://www.npmjs.com/package/oxc-parser)). */
	parserOptions?: OxcParserOptions;

	/**
	 * The transform function to modify the file name used in the `attributes.at` option
	 */
	transformFileName?: (fileName: string, location: SourceLocation) => string;

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

const DEFAULT_INCLUDE_PATTERN = /\.[jt]sx?$/;

function defaultTransformFileName(id: string, loc: SourceLocation): string {
	const fileName = id.split("/").pop() ?? "unknown";
	return `${fileName}:${loc.start.line}-${loc.end.line}`;
}

export function resolveOption(options: Options): OptionsResolved {
	return {
		include: options.include || [DEFAULT_INCLUDE_PATTERN],
		exclude: options.exclude || undefined,
		// Vite 8 runs `vite:oxc` before normal user plugins; without `pre`, this runs on code
		// that already had JSX lowered, so nothing matches. Playground used SWC path / order that hid this.
		enforce: options.enforce || "pre",
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
