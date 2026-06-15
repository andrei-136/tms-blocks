# TMS List Item block

The TMS List Item block represents a single entry inside a TMS List. Each item can contain its own text, inline formatting, and even nested inner blocks — giving you full control over each list entry.

## Settings sidebar

The settings sidebar has two tabs:

- **Wrapper** — Item content and attributes
- **Styles** — List-item-specific visual appearance

---

### Wrapper tab

[SCREENSHOT: Wrapper tab]

#### Content

Type the list item text directly in the block canvas. You can use the standard WordPress text formatting toolbar for bold, italic, strikethrough, code, subscript, superscript, and text color. The text is rendered inside a `<span>` tag within the `<li>` element.

#### Inner blocks

Each list item can also contain nested inner blocks. This is useful when a list entry needs more than just a line of text — for example, a description paragraph or an image alongside the item label. When inner blocks are present, they appear below the item text.

#### ARIA Controls

- **ARIA Label** — A text description of the list item for screen readers.
- **Role** — The list item has specialized role options including `menuitem`, `menuitemcheckbox`, `menuitemradio`, `option`, `radio`, `separator`, `tab`, `treeitem`, and `presentation`.
- **Extra ARIA Attributes** — Add other `aria-*` attributes as key-value pairs.

#### Custom Attributes

Add your own HTML attributes to the list item element:

- **`data-*` attributes** — for custom JavaScript, analytics, or styling hooks
- **`tabindex`** — to control keyboard focus order
- **`title`** — a tooltip that appears on hover

#### Identity Controls

- **ID** — Sets the `id` attribute on the `<li>` element. Spaces are automatically converted to dashes.
- **CSS Class** — Add one or more custom CSS class names for targeting with custom stylesheets.

---

### Styles tab

The Styles tab for TMS List Item includes the standard breakpoint selector and Base / Hover / Focus-Visible state tabs, with the same list-specific style panels as the TMS List block:

- **List Style Type** — Override the marker style for this specific item.
- **List Style Position** — Choose `outside` or `inside` for this item.
- **Custom Marker Image** — Use a custom image as the marker for this item.

> **Tip:** Style the list wrapper for settings that should apply to all items, and use item-level styles only when you need to override a specific entry.

---

## Example HTML output

Here's what a single TMS List Item block looks like on the front end:

```html
<li
  id="feature-unlimited"
  class="tmsblocks-list-item tmsblocks-list-item-abc123 feature-item"
  aria-label="Unlimited projects feature"
>
  <span>Unlimited projects</span>
</li>
```

With nested inner blocks:

```html
<li
  class="tmsblocks-list-item tmsblocks-list-item-abc123 feature-item"
>
  <span>Unlimited projects</span>
  <p>Create as many projects as you need without restrictions.</p>
</li>
```

## Tips

- **Keep items focused on a single idea.** Each list item should represent one point, step, or option.
- **Use nested blocks for detail.** If an item needs a supporting description, nest a TMS Paragraph block inside it.
- **This block belongs inside a TMS List.** It is designed to be a child of the TMS List block and will work best in that context.
- **Set item-level IDs for anchor links.** If you want to link directly to a specific list entry, give it an ID.

## Example uses

- one point in a benefits list
- one step in a numbered guide
- a navigation menu item (with role="menuitem")
- a list entry with a supporting description paragraph
- a tab in a custom tab interface (with role="tab")
