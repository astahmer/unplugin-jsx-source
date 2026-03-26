export function Hero() {
	return (
		<div>
			<span>Hero</span>
			<Nested />
			<Hello />
		</div>
	);
}

const Nested = () => <span>Hero.Nested</span>;
const Deep = () => <span>Hero.Hello.Deep</span>;
function Hello() {
	return (
		<>
			<span>Hero.Hello</span>
			<Deep />
		</>
	);
}
