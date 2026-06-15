# TMS Paragraph block

The TMS Paragraph block is used for body text. It works much like the standard WordPress paragraph block, but it also includes extra styling options, dynamic content support, and text truncation — all within the same familiar editing experience.

You can type text directly, edit the raw HTML, or pull content dynamically from post data. It also lets you control how long the output text should be, which is perfect for previews and excerpts.

## Settings sidebar

The settings sidebar has two tabs:

- **Wrapper** — Content source, tag selection, truncation, and attributes
- **Styles** — Visual appearance (see [The Styles tab](styles.md))

---

### Wrapper tab

[SCREENSHOT: Wrapper tab]

#### Dynamic content

At the top of the Wrapper tab, you'll find the **Use dynamic content** toggle. When turned off, you write text directly in the block. When turned on, the block pulls its content from dynamic data instead.

When dynamic content is enabled, you'll see the dynamic field settings:

- **Field path** — Choose what data to display using the step-by-step field builder. You can pull from post fields, custom fields, taxonomy terms, author info, and more.
- **Separator** — When the field returns multiple values (like a list of categories), this text goes between them. The default is a comma and space (`, `).
- **Empty text** — What to show when the dynamic field has no value. Leave it blank to output nothing, or set placeholder text like "No description available."
- **Date format** — When pulling a date field, you can choose a custom PHP date format (e.g. `F j, Y` for "January 1, 2026").
- **Comments text** — When pulling comment counts, you can customize the singular and plural labels (e.g. "1 comment" / "3 comments").
- **Post source** — Choose whether to pull from the current post (`current`) or a specific post you select (`specific`).

> **Tip:** Use the preview area at the bottom of the dynamic field settings to confirm the right data is being resolved before you publish.

#### Content (manual mode)

When dynamic content is off, type your paragraph text directly in the block. You can use the standard WordPress text formatting toolbar for bold, italic, strikethrough, code, subscript, superscript, and text color.

For more control, click the **Edit HTML** button in the block toolbar. This opens a larger editing area where you can work with the raw paragraph HTML.

#### Element Tag

Choose the HTML tag for the paragraph:

- **Paragraph (p)** — a standard paragraph (default)
- **Figcaption** — a caption for a figure element

#### Truncation

Truncation lets you limit how much text is shown. This is especially useful for previews, excerpts, or archive listings.

- **Enable truncation** — Turn it on to limit the output.
- **Length** — How many characters or words to show before cutting off.
- **Unit** — Choose between **characters** or **words**.
- **Suffix** — The text appended after truncation (default is `...`).

When truncation is on, the block tries to break at a word boundary near the length limit rather than cutting mid-word.

> **Tip:** In the editor, the block always shows the truncated version so you can see exactly what visitors will see. You can toggle truncation off temporarily while editing.

#### ARIA Controls

- **ARIA Label** — A text description of the paragraph for screen readers.
- **Role** — Override the implicit ARIA role of the paragraph.
- **Extra ARIA Attributes** — Add other `aria-*` attributes as key-value pairs.

#### Custom Attributes

Add your own HTML attributes to the paragraph element:

- **`data-*` attributes** — for custom JavaScript, analytics, or styling hooks
- **`tabindex`** — to control keyboard focus order
- **`title`** — a tooltip that appears on hover

#### Identity Controls

- **ID** — Sets the `id` attribute on the element. Spaces are automatically converted to dashes.
- **CSS Class** — Add one or more custom CSS class names for targeting with custom stylesheets.

---

## Example HTML output

Here's what a TMS Paragraph block with truncation and dynamic content might look like on the front end:

```html
<p
  id="post-excerpt"
  class="tmsblocks-paragraph tmsblocks-paragraph-xyz789 post-excerpt"
  aria-label="Post excerpt"
>
  This is a shortened version of the full article content that gives readers a
  quick preview of what to expect before they click through to read more&hellip;
</p>
```

And the auto-generated CSS (when you configure styles in the Styles tab):

```css
body .tmsblocks-paragraph-xyz789 {
  font-size: 16px;
  line-height: 1.6;
  color: #444444;
  margin-top: 0;
  margin-bottom: 16px;
}

@media (max-width: 767px) {
  body .tmsblocks-paragraph-xyz789 {
    font-size: 15px;
  }
}
```

> **Note:** The `xyz789` in the class name is a unique ID that the block generates automatically.

## Tips

- **Use truncation for previews.** When building archive pages or post listings, enable truncation to keep summaries consistent in length.
- **Check dynamic previews.** If a dynamic field is empty, make sure the empty text setting provides a good fallback.
- **Choose `figcaption` when appropriate.** If your paragraph describes an image or figure, using the `figcaption` tag adds semantic meaning.
- **The Styles tab works the same as other blocks.** See [The Styles tab](styles.md) for full details on breakpoints, state tabs, and all available style panels.

## Example uses

- a standard body paragraph
- a dynamic post excerpt or custom field value
- a truncated teaser in an archive or listing layout
- a figure caption under an image
- a data-driven paragraph in a template (e.g. author bio, product description)
