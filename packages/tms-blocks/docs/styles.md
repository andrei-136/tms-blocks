# The Styles tab

Most TMS blocks include a **Styles** tab in the settings sidebar. It works the same way across blocks, so it is documented here once rather than repeated for each block.

[SCREENSHOT: Styles tab with breakpoint selector and state tabs]

## Breakpoint Selector

At the top of the Styles tab, you'll see a breakpoint selector. This lets you switch between:

- **Desktop** — the default, full-width view
- **Tablet** — screens up to 1024px wide
- **Mobile** — screens up to 767px wide

Styles you set under Desktop apply everywhere. Styles you set under Tablet or Mobile only apply at those screen sizes and smaller — they override the Desktop values just like a CSS `@media` query would.

You can also add **custom breakpoints** with any width you like.

## State tabs

Within each breakpoint, there are three states:

- **Base** — the normal appearance of the element
- **Hover** — styles that apply when the mouse is over the element
- **Focus-Visible** — styles that apply when the element is focused via keyboard navigation

Each state has its own independent set of style controls. This means you can change the background color on hover, add an outline on focus, or adjust spacing at smaller screen sizes — all without writing any CSS.

## Style panels

The style controls inside each state tab give you fine-grained control over the element's appearance. Here are the panels you'll find:

| Panel | What you can set |
|---|---|
| **Display** | `display` (block, flex, grid, inline, none), `overflow`, `cursor`, `z-index`, `visibility`, and flex/grid item alignment |
| **Spacing** | `margin` and `padding` for all four sides, with per-side overrides |
| **Dimension** | `width`, `min-width`, `max-width`, `height`, `min-height`, `max-height`, `aspect-ratio`, and `box-sizing` |
| **Typography** | `font-family`, `font-size`, `font-weight`, `font-style`, `line-height`, `letter-spacing`, `text-align`, `text-decoration`, `text-transform`, and `color` |
| **Background** | `background-color` and background images with repeat, position, size, and attachment |
| **Border** | border width, style, and color for all four sides, plus `border-radius` |
| **Effects** | `box-shadow`, `opacity`, `filter` (blur, brightness, contrast, etc.), and `backdrop-filter` |
| **Position** | `position` (static, relative, absolute, fixed, sticky), plus top/right/bottom/left offsets |
| **Gap** | `gap`, `row-gap`, and `column-gap` — useful when the element is a flex or grid container |

## Transition controls

When you have hover or focus-visible styles set, you'll also see the **Transition** panel. This controls how smoothly the element animates between states:

- **Duration** — how long the transition takes (e.g. `0.2s`)
- **Easing** — the acceleration curve (`ease`, `ease-in`, `ease-out`, `ease-in-out`, `linear`, or a custom cubic-bezier)
- **Delay** — how long to wait before the transition starts

You can set a single global transition for all properties, or expand to control each CSS property individually.
