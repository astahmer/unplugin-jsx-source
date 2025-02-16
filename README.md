# unplugin-jsx-source

[![NPM version](https://img.shields.io/npm/v/unplugin-jsx-source?color=a1b858&label=)](https://www.npmjs.com/package/unplugin-jsx-source)

A plugin designed to automatically annotate your JSX components with a `data-at`(configurable) attribute, indicating the file name and line number for easier debugging and development.

<img width="613" alt="image" src="https://github.com/user-attachments/assets/0e3fb65f-5d01-4a19-9888-35e8eff94afb" />



## Install

```bash
npm i unplugin-jsx-source
```

<details>
<summary>Vite</summary><br>

```ts
// vite.config.ts
import jsxSource from 'unplugin-jsx-source/vite'

export default defineConfig({
  plugins: [
   jsxSource({ /* options */ }),
  ],
})
```

Example: [`playground/`](./playground/)

<br></details>

<details>
<summary>Rollup</summary><br>

```ts
// rollup.config.js
import jsxSource from 'unplugin-jsx-source/rollup'

export default {
  plugins: [
   jsxSource({ /* options */ }),
  ],
}
```

<br></details>

<details>
<summary>Webpack</summary><br>

```ts
// webpack.config.js
module.exports = {
  /* ... */
  plugins: [
    require('unplugin-jsx-source/webpack')({ /* options */ })
  ]
}
```

<br></details>

<details>
<summary>Nuxt</summary><br>

```ts
// nuxt.config.js
export default defineNuxtConfig({
  modules: [
    ['unplugin-jsx-source/nuxt', { /* options */ }],
  ],
})
```

> This module works for both Nuxt 2 and [Nuxt Vite](https://github.com/nuxt/vite)

<br></details>

<details>
<summary>Vue CLI</summary><br>

```ts
// vue.config.js
module.exports = {
  configureWebpack: {
    plugins: [
      require('unplugin-jsx-source/webpack')({ /* options */ }),
    ],
  },
}
```

<br></details>

<details>
<summary>esbuild</summary><br>

```ts
// esbuild.config.js
import { build } from 'esbuild'
import jsxSource from 'unplugin-jsx-source/esbuild'

build({
  plugins:  jsxSource()],
})
```

<br></details>

## Made with

https://github.com/unplugin/unplugin-starter

cause I saw that idea again from Nate (Tamagui's author) https://x.com/natebirdman/status/1890913196967419958

although Astro also has it with `<div data-astro-source-file="/absolute/path/file.astro" data-astro-source-loc="72:49"`
