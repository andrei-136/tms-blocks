# TMS Dynamic Field block

The TMS Dynamic Field block displays data pulled from the current post, a Query Loop, a Post Context, or a specific post you select. It's the most flexible way to output dynamic content — post titles, dates, custom fields, taxonomy terms, author info, comment counts, and more.

Unlike the other dynamic-capable blocks (Heading, Paragraph, etc.), this block is purpose-built for dynamic output. It can display multiple values at once, switch between text/image/link output, and style each item independently — all without writing any code.

## Settings sidebar

The settings sidebar has three tabs:

- **Settings** — Field path, item type, separator, and container attributes
- **Item** — Styles for each individual item in the output
- **Container** — Styles for the wrapper element around all items

---

### Settings tab

[SCREENSHOT: Settings tab]

#### Quick setup

At the very top, a preset dropdown lets you configure common field paths in one click — like "Post Title," "Post Date," "Categories," "Tags," "Author Name," "Featured Image," and more. Choose a preset, pick a taxonomy if needed, and click **Apply**. The field path builder fills in automatically.

#### Field path

The field path builder is where you define what data to display. You build a path step by step, choosing from:

- **Post fields** — title, date, modified date, excerpt, content, slug, status, ID
- **Custom fields** — any post meta / ACF field
- **Taxonomy terms** — categories, tags, or custom taxonomy terms
- **Author info** — name, email, bio, URL
- **Comments** — comment count

> **Tip:** Use the **Preview** area below the path builder to confirm the right data is being resolved before you publish.

#### Value options

- **Separator** — When the field returns multiple values (like a list of categories), this text goes between them. Default is a comma and space (`, `).
- **Empty text** — What to display when the field has no value. Leave blank to show nothing, or set fallback text like "No categories."
- **Date format** — When displaying a date field, enter a custom PHP date format (e.g. `F j, Y` for "January 1, 2026").
- **Comments text** — When displaying comment counts, customize the singular and plural labels (e.g. "1 reply" / "3 replies").

#### Post source

Choose where the data comes from:

- **Current** — The current post (or the context from a Post Context block or Query Loop).
- **Specific** — A specific post you search for and select.

#### Preview limit

Controls how many items are shown in the editor preview. Default is 5, range is 1–20. This only affects the editor — the front end always shows all values.

#### Item type

Choose how each value is rendered:

- **Text** — Output as inline or block text. You can choose the HTML tag: `span` (inline), `div` (block), `p` (paragraph), `li` (list item), or `h2`–`h4` (headings).
- **Image** — Output as `<img>` tags. Best for fields that return image URLs or attachment IDs. For single images with full controls, use the [TMS Img block](img.md) instead.
- **URL / Link** — Output as clickable `<a>` tags. When selected, additional link settings appear.

#### URL / Link settings

When item type is set to URL/Link, you get detailed control over the link behavior:

- **href source** — Where the link URL comes from:
  - *Field value is the URL* — each value is used directly as the href
  - *URL from a different field* — use a separate field path for the URL
  - *Same URL for every item* — all items link to the same static URL
- **Link label** — What text appears for each link:
  - *Static* — same text for all links (falls back to the field value if empty)
  - *Dynamic* — resolved per link from a separate field path
- **Open in** — Same tab or new tab

> **Note:** When the href source is set to "URL from a different field," the original field value is used as the label automatically.

#### Item class name

Add a CSS class that will be applied to every individual item in the output. Useful for targeting items with custom stylesheets.

#### Container Wrapper

A collapsible panel at the bottom of the Settings tab contains the wrapper configuration:

- **Tag** — The HTML tag for the container that wraps all items (`div`, `section`, `span`, etc.)
- **ID** and **CSS Class** — Identity controls for the container
- **ARIA Controls** — Label, role, and extra attributes
- **Custom Attributes** — `data-*`, `tabindex`, `title`

---

### Item tab

The Item tab controls the appearance of each individual item in the output. It includes the standard breakpoint selector and Base / Hover / Focus-Visible state tabs. The available style panels depend on the item type:

| Item type | Style panels available |
|---|---|
| **Text** | Typography, Color, Background, Border, Spacing, Dimension, Effects, Display, Position, Flex/Grid Item |
| **Image** | Dimension, Border, Effects, Object (fit/position), Display, Position, Spacing, Flex/Grid Item |
| **URL / Link** | Typography, Color, Background, Border, Spacing, Dimension, Effects, Display, Position, Flex/Grid Item |

Transition controls are available for hover and focus-visible states, so you can animate between states smoothly.

---

### Container tab

The Container tab controls the appearance of the wrapper around all items. It includes the same breakpoint selector and state tabs, with the full set of style panels — everything from Display and Spacing through to Effects and Position. See [The Styles tab](styles.md) for the complete list.

---

## Example HTML output

Here's what a Dynamic Field block showing taxonomy terms might look like on the front end:

```html
<div
  class="tmsblocks-dynamic-field tmsblocks-dynamic-field-abc789 post-categories"
>
  <span data-tmsblocks-dynamic-field-item>
    <a href="https://example.com/category/tutorials">Tutorials</a>
  </span>
  <span class="tmsblocks-dynamic-field-separator" aria-hidden="true">, </span>
  <span data-tmsblocks-dynamic-field-item>
    <a href="https://example.com/category/wordpress">WordPress</a>
  </span>
  <span class="tmsblocks-dynamic-field-separator" aria-hidden="true">, </span>
  <span data-tmsblocks-dynamic-field-item>
    <a href="https://example.com/category/plugins">Plugins</a>
  </span>
</div>
```

And the auto-generated CSS (when you configure styles):

```css
body .tmsblocks-dynamic-field-abc789 {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

body .tmsblocks-dynamic-field-abc789 [data-tmsblocks-dynamic-field-item] {
  font-size: 13px;
  background-color: #f0f0f5;
  padding: 4px 10px;
  border-radius: 4px;
}

body .tmsblocks-dynamic-field-abc789 a:hover {
  color: #0066cc;
}
```

> **Note:** Each item gets a `data-tmsblocks-dynamic-field-item` attribute for CSS targeting. Separators have `aria-hidden="true"` so screen readers don't announce them.

## Tips

- **Start with a preset.** The Quick Setup dropdown covers the most common use cases — post title, date, categories, featured image — and fills in the path for you.
- **Use the preview to verify.** Before publishing, check that the preview shows the expected value. If it's empty, the path may need adjusting or the post may not have that data.
- **Choose the right item type.** Use Text for most metadata, Image for featured images or galleries, and URL/Link for clickable terms or custom links.
- **Empty text is a good fallback.** Set it to something like "No categories" or "Untitled" so the output never looks broken.
- **Use inside a Post Context or Query Loop.** The block respects context automatically — inside a Query Loop it displays per-item data, inside a Post Context it reads from the selected post.
- **Item styles apply to every item.** If you need per-item differentiation, use the item class name and custom CSS.

## Example uses

- displaying the current post's publish date
- listing all categories or tags for a post
- showing a custom field like a subtitle or external URL
- outputting a list of taxonomy terms as clickable links
- displaying an author's name, bio, and avatar in a template
- building a dynamic image gallery from a multi-value custom field
