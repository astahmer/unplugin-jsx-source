import { expect, test } from "vitest";
import { resolveOption } from "../src/options";
import { transform } from "../src/transform";
const fileName = `/users/alex/projects/vite-template/src/file.tsx`;

test("simple", () => {
	const code = `
    export const App = () => {
      return (
          <Hello />
      )
    }

    function Hello (props: ComponentProps<"span">) {
        return <span {...props}>hello</span>
    }
    `;
	expect(
		transform(code, fileName, resolveOption({})).code,
	).toMatchInlineSnapshot(`
		"export const App = () => {
		  return <Hello data-at="file.tsx:4-4" data-in="App" data-kind="Hello" />;
		};
		function Hello(props: ComponentProps<"span">) {
		  return <span {...props} data-at="file.tsx:9-9" data-in="Hello">hello</span>;
		}"
	`);
});

test("ignore fragment", () => {
	const code = `
    export const App = () => {
      return (
          <>hello</>
      )
    }
    `;
	expect(
		transform(code, fileName, resolveOption({})).code,
	).toMatchInlineSnapshot(`
		"export const App = () => {
		  return <>hello</>;
		};"
	`);
});

test("options.attributes.at", () => {
	const code = `
    export const App = () => {
      return (
          <Hello />
      )
    }
    `;
	expect(
		transform(
			code,
			fileName,
			resolveOption({
				attributes: {
					at: "data-source",
				},
			}),
		).code,
	).toMatchInlineSnapshot(`
		"export const App = () => {
		  return <Hello data-source="file.tsx:4-4" data-in="App" data-kind="Hello" />;
		};"
	`);
});

test("disable options.attributes.at", () => {
	const code = `
    export const App = () => {
      return (
          <Hello />
      )
    }
    `;
	expect(
		transform(
			code,
			fileName,
			resolveOption({
				attributes: {
					at: false,
				},
			}),
		).code,
	).toMatchInlineSnapshot(`
		"export const App = () => {
		  return <Hello data-in="App" data-kind="Hello" />;
		};"
	`);
});

test("options.attributes.at + transformFileName", () => {
	const code = `
    export const App = () => {
      return (
          <Hello />
      )
    }
    `;
	expect(
		transform(
			code,
			fileName,
			resolveOption({
				transformFileName: (fileName, loc) =>
					"DEV-" + fileName + ":" + loc.start.line + "-" + loc.end.line,
			}),
		).code,
	).toMatchInlineSnapshot(`
		"export const App = () => {
		  return <Hello data-at="DEV-/users/alex/projects/vite-template/src/file.tsx:4-4" data-in="App" data-kind="Hello" />;
		};"
	`);
});

test("kitchen sink", () => {
	const code = `
    export const App = () => {
      return (
        <div>
          <Hello />
        </div>
      )
    }

    const Deep = (props: ComponentProps<"span">) => <span {...props}>Hero.Hello.Deep</span>
    function Hello (props: ComponentProps<"span">) {
    return <>
      <span {...props}>Hero.Hello</span>
      <div>text</div>
      <Deep />
    </>
    }
    `;
	expect(
		transform(code, fileName, resolveOption({})).code,
	).toMatchInlineSnapshot(`
		"export const App = () => {
		  return <div data-at="file.tsx:4-4" data-in="App">
		          <Hello data-at="file.tsx:5-5" data-in="App" data-kind="Hello" />
		        </div>;
		};
		const Deep = (props: ComponentProps<"span">) => <span {...props} data-at="file.tsx:10-10" data-in="Deep">Hero.Hello.Deep</span>;
		function Hello(props: ComponentProps<"span">) {
		  return <>
		      <span {...props} data-at="file.tsx:13-13" data-in="Hello">Hero.Hello</span>
		      <div data-at="file.tsx:14-14" data-in="Hello">text</div>
		      <Deep data-at="file.tsx:15-15" data-in="Hello" data-kind="Deep" />
		    </>;
		}"
	`);
});
