export const Hero = () => <div
>
    <span>Hero</span>
    <Nested />
    <Hello />

</div>

const Nested = () => <span>Hero.Nested</span>
const Deep = () => <span>Hero.Hello.Deep</span>
const Hello = () => <>
    <span>Hero.Hello</span>
    <Deep />
</>
