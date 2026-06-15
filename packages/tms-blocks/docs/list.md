# TMS List block

The TMS List block creates an ordered or unordered list. It is designed to work with TMS List Item blocks inside it — each item gets its own block so you can style and manage them individually.

## Settings sidebar

The settings sidebar has two tabs:

- **Wrapper** — List type and attributes
- **Styles** — List-specific visual appearance

---

### Wrapper tab

[SCREENSHOT: Wrapper tab]

#### List Type

Choose between two list formats:

- **Unordered List (ul)** — bulleted list (default)
- **Ordered List (ol)** — numbered list

#### Inner blocks

TMS List uses inner blocks for each list entry. When you insert a TMS List block, it starts with one TMS List Item inside it. You can:

- Add more items using the **+** appender at the bottom of the list
- Reorder items by dragging them in the editor
- Nest other blocks inside list items for more complex layouts

The list also accepts TMS Block (Generic Block) as inner blocks, giving you even more flexibility for structured content inside a list.

#### ARIA Controls

- **ARIA Label** — A text description of the list for screen readers.
- **Role** — The list has specialized role options including `directory`, `group`, `listbox`, `menu`, `menubar`, `radiogroup`, `tablist`, `toolbar`, `tree`, and `presentation`.
- **Extra ARIA Attributes** — Add other `aria-*` attributes as key-value pairs.

#### Custom Attributes

Add your own HTML attributes to the list element:

- **`data-*` attributes** — for custom JavaScript, analytics, or styling hooks
- **`tabindex`** — to control keyboard focus order
- **`title`** — a tooltip that appears on hover

#### Identity Controls

- **ID** — Sets the `id` attribute on the list element. Spaces are automatically converted to dashes.
- **CSS Class** — Add one or more custom CSS class names for targeting with custom stylesheets.

---

### Styles tab

The Styles tab for TMS List focuses specifically on list styling. It includes the standard breakpoint selector and Base / Hover / Focus-Visible state tabs, but the style panels are list-specific:

- **List Style Type** — Choose from common marker styles: `disc`, `circle`, `square`, `decimal`, `decimal-leading-zero`, `lower-roman`, `upper-roman`, `lower-greek`, `lower-alpha`, `upper-alpha`, or `none`. You can also enter a custom CSS value like `lower-latin` or a string like `"-> "`.
- **List Style Position** — Choose `outside` (marker sits to the left of the text) or `inside` (marker sits within the text flow).
- **Custom Marker Image** — Replace the default bullet or number with a custom image.

> **Tip:** The list style type and position can be set independently per breakpoint and per state (Base, Hover, Focus-Visible).

---

## Example HTML output

Here's what a TMS List block with items might look like on the front end:

```html
<ul
  id="features-list"
  class="tmsblocks-list-block tmsblocks-list-block-def789 features"
  aria-label="Available features"
>
  <li class="tmsblocks-list-item tmsblocks-list-item-abc123">
    <span>Unlimited projects</span>
  </li>
  <li class="tmsblocks-list-item tmsblocks-list-item-def456">
    <span>Priority support</span>
  </li>
  <li class="tmsblocks-list-item tmsblocks-list-item-ghi789">
    <span>Advanced reporting</span>
  </li>
</ul>
```

And the auto-generated CSS:

```css
body .tmsblocks-list-block-def789 {
  list-style-type: square;
  list-style-position: outside;
  margin-top: 16px;
  margin-bottom: 16px;
  padding-left: 24px;
}
```

> **Note:** Each block gets its own unique class name — `def789` for the list, `abc123`/`def456`/`ghi789` for each item.

## Tips

- **Use unordered lists for general grouped information** like features, benefits, or links.
- **Use ordered lists for sequences** like steps, rankings, or instructions.
- **Style the list wrapper for shared spacing** and use item-level styles for per-item customizations.
- **Lists work together.** Always use TMS List Item blocks inside a TMS List block for the best editing experience.

## Example uses

- a feature list on a product page
- a step-by-step numbered guide
- a styled navigation menu (with role="navigation")
- a list of resource links with custom markers
