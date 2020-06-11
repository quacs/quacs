# QuACS - The Questionably Accurate Course Scheduler

View the live version here: [https://quacs.org](https://quacs.org)

Join the development [discord](https://discord.gg/EyGZTAP)!
You can view QuACS at [https://quacs.org](https://quacs.org)

Want to help with development? Join the development [discord](https://discord.gg/EyGZTAP)!

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
- Your privacy is extremely important. We do not track website visits and, because everything is client side, you can rest assured that nothing you upload or do on QuACS is viewable by anyone else.

# Other Notes

While QuACS and the developers are huge fans of [RCOS](https://rcos.io/), we are not affiliated with RCOS at this time. If you want to help out with development, join our [Discord server](https://discord.gg/EyGZTAP).

We are also not affiliated with YACS. The work they have done has been invaluable to the RPI student body and while our codebase is different, much of our design was inspired by YACS. We however also support competition and believe we provide a number of features that YACS does not. We are hoping you try us out when you register for classes next semester.

# Development info

## Project setup
```
yarn install
```

### Compiles and hot-reloads for development
```
yarn serve
```

### Lints and fixes files
```
yarn lint
```

## Contributing a theme
Please replace `dark` with your theme name
1. Make a copy of `src/assets/styles/colors.css` into the themes folder with the name `dark.css`
2. Import your theme in `src/main.ts` using `import "@/assets/styles/themes/dark.css";`
2. Replace `:root {` on line 1 in the new css file with `[data-theme="dark"] {`
3. Go to `src/components/Settings.vue` and add your theme to `themeOptions` in the format `{ value: "dark", text: "Dark" },`
4. Edit the colors in your new css file and when you are ready, make a pull request!
