# QuACS - The Questionably Accurate Course Scheduler

View the live website here: [https://quacs.org](https://quacs.org)

Want to ask a question, help with development, or just hang out? [Join our discord!](https://discord.gg/nZKAzzE5bX)

# What are people saying?

> quacs do be lookin pretty fresh tho
> — *Former YACS Project Manager*

> "Best thing since sliced bread"
> — *Chris Jerrett*

> > plz dont quote me
> > — *@quacs duck*
> — *@quacs duck*

# QuACS Philosophy

- Course Scheduling is not that complex and can be done in the user's browser.  QuACS will always be a simple static website on GitHub pages.
- QuACS should be accessible to everyone. If you have an accessibility issue, please let us know and we will try our best to fix it.
- Mobile phones should not be second class citizens. Do not hide important data from people on mobile devices.
- Open Source. Everything in QuACS is open source under the MIT License.
- Competition drives innovation. We love competition because we feel that everyone is better off because of it. Our data is not only publicly stored in this repo, but it also is easy to acquire yourself using our scrapers. We would love to see what people can do with the data!
- Your privacy is extremely important. We do not collect any identifying data and, because everything is client side, you can rest assured that nothing you upload or do on QuACS is viewable by anyone else.

# Other Notes

QuACS is a proud member of the [Rensselaer Center for Open Source](https://rcos.io/)

QuACS is not affiliated with YACS. The work they have done has been invaluable to the RPI student body and while our codebase is different, much of our design was inspired by YACS. We however also support competition and believe we provide a number of features that YACS does not. We are hoping you try us out when you register for classes next semester.

# Development info

**NOTE:** The following commands **MUST** be run within the `site/` directory:

## Project setup
```
yarn install
```

You'll also need to install `Rust` and `wasm-pack` to build the WebAssembly components of the website.  
Instructions for `Rust` can be found [here](https://www.rust-lang.org/tools/install)  
Instructions for installing `wasm-pack` can be found [here](https://rustwasm.github.io/wasm-pack/installer/).

**NOTE:** If you are using a Mac, you may need to edit `quacs-rs/Cargo.toml` to set `wasm-opt = false`.

### Compiles and hot-reloads for development
```
yarn serve
```

### Lints and fixes files
```
yarn lint
```

### Run e2e tests
To start a local test server running on the correct semester for the e2e tests run:
```
yarn test:serve
```
Once the server is up and running you can launch cypress and run the tests with:
```
yarn test:e2e
```
Or run it headlessly with:
```
yarn test:e2e:headless
```

## Contributing a theme
Please replace `dark` with your theme name
1. Make a copy of `site/src/assets/styles/colors.css` into the themes folder with the name `dark.css`
2. Import your theme in `site/src/main.ts` using `import "@/assets/styles/themes/dark.css";`
2. Replace `:root {` on line 1 in the new css file with `[data-theme="dark"] {`
3. Go to `site/src/components/Settings.vue` and add your theme to `themeOptions` in the format `{ value: "dark", text: "Dark" },`
4. Edit the colors in your new css file and when you are ready, make a pull request!
