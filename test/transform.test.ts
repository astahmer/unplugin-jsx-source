import { expect, it } from "vitest";
import { resolveOption } from "../src/options";
import { transform } from "../src/transform";

const fileName = `/users/alex/projects/vite-template/src/file.tsx`;

it("strips ?query from module id for parse + lang (e.g. TanStack Router tsr-split)", () => {
	const code = `export const Route = { component: () => <Outlet /> };`;
	const idWithQuery = `/app/routes/_auth.tsx?tsr-split=component`;
	expect(transform(code, idWithQuery, resolveOption({})).code).toContain(
		'data-at="_auth.tsx:1-1"',
	);
});

it("simple", () => {
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
	expect(transform(code, fileName, resolveOption({})).code)
		.toMatchInlineSnapshot(`
			"
			    export const App = () => {
			      return (
			          <Hello  data-at="file.tsx:4-4" data-in="App" data-kind="Hello"/>
			      )
			    }

			    function Hello (props: ComponentProps<"span">) {
			        return <span {...props}>hello</span>
			    }
			    "
		`);
});

it("ignore fragment", () => {
	const code = `
    export const App = () => {
      return (
          <>hello</>
      )
    }
    `;
	expect(transform(code, fileName, resolveOption({})).code)
		.toMatchInlineSnapshot(`
			"
			    export const App = () => {
			      return (
			          <>hello</>
			      )
			    }
			    "
		`);
});

it("ignore named fragment", () => {
	const code = `
    export const App = () => {
      return (
          <Fragment>hello</Fragment>
      )
    }
    `;
	expect(transform(code, fileName, resolveOption({})).code)
		.toMatchInlineSnapshot(`
			"
			    export const App = () => {
			      return (
			          <Fragment>hello</Fragment>
			      )
			    }
			    "
		`);
});

it("options.attributes.at", () => {
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
		"
		    export const App = () => {
		      return (
		          <Hello  data-source="file.tsx:4-4" data-in="App" data-kind="Hello"/>
		      )
		    }
		    "
	`);
});

it("disable options.attributes.at", () => {
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
		"
		    export const App = () => {
		      return (
		          <Hello  data-in="App" data-kind="Hello"/>
		      )
		    }
		    "
	`);
});

it("options.attributes.at + transformFileName", () => {
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
					`DEV-${fileName}:${loc.start.line}-${loc.end.line}`,
			}),
		).code,
	).toMatchInlineSnapshot(`
		"
		    export const App = () => {
		      return (
		          <Hello  data-at="DEV-/users/alex/projects/vite-template/src/file.tsx:4-4" data-in="App" data-kind="Hello"/>
		      )
		    }
		    "
	`);
});

it("kitchen sink", () => {
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
	expect(transform(code, fileName, resolveOption({})).code)
		.toMatchInlineSnapshot(`
			"
			    export const App = () => {
			      return (
			        <div data-at="file.tsx:4-4" data-in="App">
			          <Hello  data-at="file.tsx:5-5" data-in="App" data-kind="Hello"/>
			        </div>
			      )
			    }

			    const Deep = (props: ComponentProps<"span">) => <span {...props}>Hero.Hello.Deep</span>
			    function Hello (props: ComponentProps<"span">) {
			    return <>
			      <span {...props}>Hero.Hello</span>
			      <div data-at="file.tsx:14-14" data-in="Hello">text</div>
			      <Deep  data-at="file.tsx:15-15" data-in="Hello" data-kind="Deep"/>
			    </>
			    }
			    "
		`);
});

it("avoid data attribute override with spread props", () => {
	const code = `
	import { forwardRef, PropsWithChildren } from "react";

	export interface ButtonProps {}

	export const Button = forwardRef<HTMLButtonElement, PropsWithChildren>(
		function Button(props, ref) {
			return (
				<ChakraButton
					borderRadius="md"
					ref={ref}
					{...rest}
				>
					{children}
				</ChakraButton>
			);
		},
	);

    const SimpleButton = (props) => {
        return <button {...props} />
    }

    const TiktokPage = () => {
        return <>
			<SimpleButton>click</SimpleButton>
			<Button>click</Button>
		</>
    }
    `;
	expect(transform(code, fileName, resolveOption({})).code)
		.toMatchInlineSnapshot(`
			"
				import { forwardRef, PropsWithChildren } from "react";

				export interface ButtonProps {}

				export const Button = forwardRef<HTMLButtonElement, PropsWithChildren>(
					function Button(props, ref) {
						return (
							<ChakraButton
								borderRadius="md"
								ref={ref}
								{...rest}
							 data-kind="ChakraButton">
								{children}
							</ChakraButton>
						);
					},
				);

			    const SimpleButton = (props) => {
			        return <button {...props} />
			    }

			    const TiktokPage = () => {
			        return <>
						<SimpleButton data-at="file.tsx:26-26" data-in="TiktokPage" data-kind="SimpleButton">click</SimpleButton>
						<Button data-at="file.tsx:27-27" data-in="TiktokPage" data-kind="Button">click</Button>
					</>
			    }
			    "
		`);
});
