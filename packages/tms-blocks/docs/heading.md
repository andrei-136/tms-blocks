# TMS Heading block

The TMS Heading block is used for titles and section headings. It gives you control over the heading level — H1 through H6 — and supports both manual text and dynamic content. You can type a heading directly, edit the raw HTML, or pull the heading text from post data.

## Settings sidebar

The settings sidebar has two tabs:

- **Wrapper** — Heading level, content source, and attributes
- **Styles** — Visual appearance (see [The Styles tab](styles.md))

---

### Wrapper tab

[SCREENSHOT: Wrapper tab]

#### Heading Level

Choose the heading level from H1 to H6. The default is H2.

You can also change the level quickly from the block toolbar — the current level is shown in a dropdown button at the top of the editor canvas.

> **Tip:** Use heading levels in order to keep your page well structured. Reserve H1 for the main page or post title when possible, and use H2–H6 for subsections.

#### Dynamic content

At the top of the Wrapper tab, you'll find the **Use dynamic content** toggle. When turned off, you type the heading text directly. When turned on, the block pulls its text from dynamic data instead.

When dynamic content is enabled, you'll see the dynamic field settings:

- **Field path** — Choose what data to display using the step-by-step field builder. You can pull from post fields, custom fields, taxonomy terms, author info, and more.
- **Separator** — When the field returns multiple values, this text goes between them. The default is a comma and space (`, `).
- **Empty text** — What to show when the dynamic field has no value. Leave it blank to output an empty heading, or set fallback text.
- **Date format** — When pulling a date field, choose a custom PHP date format (e.g. `F j, Y` for "January 1, 2026").
- **Comments text** — When pulling comment counts, customize the singular and plural labels.
- **Post source** — Choose whether to pull from the current post (`current`) or a specific post (`specific`).

> **Tip:** Use the preview area at the bottom of the dynamic field settings to confirm the right heading text is resolved before you publish.

#### Content (manual mode)

When dynamic content is off, type your heading directly in the block. You can use the standard WordPress text formatting toolbar for bold, italic, strikethrough, code, subscript, superscript, and text color.

For more control, click the **Edit HTML** button in the block toolbar. This opens a larger editing area where you can work with the raw heading HTML.

> **Note:** Headings should only contain phrasing-level HTML tags like `strong`, `em`, `code`, `span`, `br`, and similar. The editor will warn you if you add block-level elements like `div` or `p` inside a heading.

#### ARIA Controls

- **ARIA Label** — A text description of the heading for screen readers.
- **Role** — Override the implicit ARIA role of the heading.
- **Extra ARIA Attributes** — Add other `aria-*` attributes as key-value pairs.

#### Custom Attributes

Add your own HTML attributes to the heading element:

- **`data-*` attributes** — for custom JavaScript, analytics, or styling hooks
- **`tabindex`** — to control keyboard focus order
- **`title`** — a tooltip that appears on hover

#### Identity Controls

- **ID** — Sets the `id` attribute on the element. This is especially useful for headings because they are common anchor link targets. Spaces are automatically converted to dashes.
- **CSS Class** — Add one or more custom CSS class names for targeting with custom stylesheets.

---

## Example HTML output

Here's what a TMS Heading block might look like on the front end:

```html
<h2
  id="section-overview"
  class="tmsblocks-heading tmsblocks-heading-abc456 section-title"
  aria-label="Overview section"
>
  Getting Started with TMS Blocks
</h2>
```

And the auto-generated CSS (when you configure styles in the Styles tab):

```css
body .tmsblocks-heading-abc456 {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.3;
  color: #1a1a1a;
  margin-top: 32px;
  margin-bottom: 12px;
}

@media (max-width: 767px) {
  body .tmsblocks-heading-abc456 {
    font-size: 22px;
    margin-top: 24px;
  }
}
```

> **Note:** The `abc456` in the class name is a unique ID that the block generates automatically.

## Tips

- **Respect the heading hierarchy.** Don't skip levels — an H2 should be followed by H3 subsections, not H4. This helps both accessibility and SEO.
- **Set an ID for anchor links.** If you plan to link to a section, give its heading a memorable ID so you can use it in a TMS Link block.
- **Dynamic headings are great for templates.** Pull the post title, author name, or a custom field as a heading to make reusable layouts.
- **The Styles tab works the same as other blocks.** See [The Styles tab](styles.md) for full details on breakpoints, state tabs, and all available style panels.

## Example uses

- a page section title
- a dynamically pulled post title in a template
- a featured heading in a content card
- an anchor-linked heading for a table of contents
- a styled hero title with custom typography and responsive sizing
