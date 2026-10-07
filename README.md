# Cmd Color

Rainbow-colors each argument of a shell command in fenced code blocks, like
VS Code's *Rainbow CSV* does for columns. Works in **Reading view**, **Live Preview**
and **Source mode** (while you edit inside the block).

````md
```cmd
ros2 bag record /tf_static /tf /odometry/filtered \
    --output ./bags/run1 --storage mcap
```
````

Both `cmd` and `command` are recognised as the block language.

## Features

- Each argument gets the next color in an 8-color cycle; the command name is **bold**, flags (`-x`, `--x`) are *italic*.
- Quoted arguments stay together: `--name="hello world"` is one argument.
- Lines ending with `\` continue the same command, so colors keep counting.
- `#` comment lines are dimmed.
- Long commands wrap instead of scrolling; hover a block in Reading view for a **Copy** button.

## Customizing colors

Add a CSS snippet that overrides the palette:

```css
body {
  --rc-color-0: #ff5555;
  --rc-color-1: #ffb86c;
  /* ... up to --rc-color-7 */
}
```

## Installation

### Manual
Copy `main.js`, `manifest.json` and `styles.css` from the latest release into
`<vault>/.obsidian/plugins/cmd-color/`, then enable **Cmd Color** in
*Settings → Community plugins*.

### BRAT
Add `HTLife/obsidian-plugin-cmd-color` in the BRAT plugin.

## Releasing

Bump `version` in `manifest.json` and `versions.json`, commit, then push a tag with
the same version (no `v` prefix), e.g. `git tag 0.1.1 && git push origin 0.1.1`.
The GitHub Action creates a release with the plugin files attached.

## License

MIT
