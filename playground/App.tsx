import type { ComponentProps } from "react";
import { Hero } from "./another";

export function App() {
	return (
		<div>
			<>fragment</>
			<Hero />
			<span>Span</span>
			<Hello />
		</div>
	);
}

const Deep = (props: ComponentProps<"span">) => (
	<span {...props}>Hero.Hello.Deep</span>
);
function Hello(props: ComponentProps<"span">) {
	return (
		<>
			<span {...props}>Hero.Hello</span>
			<div>oui</div>
			<Deep />
		</>
	);
}
