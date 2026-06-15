# TMS Link (Anchor) block

The TMS Link block creates a clickable link — an `<a>` tag — with full control over the destination, the visible label, and the link's behavior. You can use it for simple text links, links that wrap inner blocks (like a linked card), or links that pull their URL and label dynamically from post data.

> **Note:** In the editor, the block appears as a `<div>` wrapper so you can place block-level elements inside it. On the front end, it renders as a proper `<a>` tag.

## Settings sidebar

The settings sidebar has two tabs:

- **Wrapper** — URL, label, link behavior, and attributes
- **Styles** — Visual appearance (see [The Styles tab](styles.md))

---

### Wrapper tab

[SCREENSHOT: Wrapper tab]

#### Link URL

The URL is where the link goes. You have two options:

**Manual URL** — Type or paste a URL into the **Link (href)** field. You can use template variables that will be replaced when the page loads:

- `{{page_url}}` — the URL of the current post or page
- `{{post_url}}` — same as `{{page_url}}`
- `{{site_url}}` — your site's home URL
- `{{title}}` — the title of the current post or page

**Dynamic link** — Turn on the **Use dynamic link** toggle to pull the URL from dynamic data instead. Choose a field path using the step-by-step builder. Special dynamic paths are also supported:

- `link:author_archive` — links to the post author's archive page
- `link:author_mailto` — creates a `mailto:` link for the post author's email
- `link:term_archive` — links to the first taxonomy term's archive page

> **Tip:** Use the preview area to confirm the resolved URL before publishing.

#### Link label

The label is the visible text people click. It is configured separately from the URL — setting a URL does not automatically create a label. You have two options:

**Manual label** — Type the label text directly in the block canvas. You can use inline formatting (bold, italic, etc.) and the text is wrapped in a `<span>` inside the `<a>` tag.

**Dynamic label** — Turn on the **Use dynamic label** toggle to pull the label from dynamic data. This uses its own independent field path, so your URL and label can come from different sources.

If you don't provide a label, you can use **inner blocks** instead — drop paragraphs, images, headings, or other blocks inside the link to create rich linked content like a clickable card.

> **Important:** Nesting a TMS Link inside another TMS Link is not allowed. The editor will show an error if you try. Only TMS blocks are tested for this — we cannot guarantee the notice will appear for other blocks.

#### Link behavior

- **Target** — Choose where the link opens: same tab (default), new tab (`_blank`), parent frame (`_parent`), top frame (`_top`), or same frame (`_self`).
- **REL** — Add link relationship values by checking the boxes you need: `nofollow`, `noopener`, `noreferrer`, `sponsored`, `ugc`, `author`, `license`, `me`, `next`, `prev`, `search`.
- **Referrer Policy** — Control how much referrer information is sent when the link is clicked. Options range from `no-referrer` (sends nothing) to `unsafe-url` (sends the full URL).

#### ARIA Controls

- **ARIA Label** — A text description of the link for screen readers. Especially important when the link has no visible text label.
- **Role** — The link has specialized role options including `button`, `checkbox`, `menuitem`, `menuitemcheckbox`, `menuitemradio`, `option`, `radio`, `switch`, `tab`, and `treeitem`.
- **Extra ARIA Attributes** — Add other `aria-*` attributes as key-value pairs.

#### Custom Attributes

Add your own HTML attributes to the link element:

- **`data-*` attributes** — for custom JavaScript, analytics, or styling hooks
- **`tabindex`** — to control keyboard focus order
- **`title`** — a tooltip that appears on hover
- **`download`** — suggests the linked resource should be downloaded

#### Identity Controls

- **ID** — Sets the `id` attribute on the link. Spaces are automatically converted to dashes.
- **CSS Class** — Add one or more custom CSS class names for targeting with custom stylesheets.

---

## Example HTML output

Here's what a TMS Link block might look like on the front end:

**Simple text link:**

```html
<a
  href="https://example.com/about"
  class="tmsblocks-anchor tmsblocks-anchor-abc123"
  target="_blank"
  rel="noopener noreferrer"
>
  <span>Learn more about us</span>
</a>
```

**Linked card with inner blocks:**

```html
<a
  href="https://example.com/project"
  class="tmsblocks-anchor tmsblocks-anchor-def456 card-link"
  aria-label="View project details"
>
  <span>Project Alpha</span>
  <p>A groundbreaking new approach to data visualization.</p>
</a>
```

**Dynamic link:**

```html
<a
  href="https://example.com/author/jane-doe"
  class="tmsblocks-anchor tmsblocks-anchor-ghi789"
  rel="author"
>
  <span>Jane Doe</span>
</a>
```

And the auto-generated CSS:

```css
body .tmsblocks-anchor-abc123 {
  color: #0066cc;
  text-decoration: underline;
}

@media (hover: hover) and (pointer: fine) {
  body .tmsblocks-anchor-abc123:hover {
    color: #004499;
    text-decoration: none;
  }
}
```

> **Note:** The `abc123` in the class name is a unique ID that the block generates automatically.

## Tips

- **Always provide a label.** If a link has a URL but no visible label or inner blocks, visitors won't see anything to click.
- **Use a clear, descriptive label.** Text like "Read more", "View project", or the title of the destination page helps both users and screen readers.
- **Open links in a new tab sparingly.** Only use `_blank` when it genuinely improves the user experience, and always include `noopener noreferrer` for security.
- **Inner blocks make great linked cards.** Nest a heading, image, and paragraph inside a TMS Link to create a clickable card that works as a single link.
- **Dynamic label and URL are independent.** You can pull the URL from one dynamic source and the label from another — they don't need to match.

## Example uses

- a text link to another page
- a button-styled call-to-action link
- a linked card containing an image, heading, and description
- a dynamic author link pulled from post data
- a download link with the `download` attribute
- a `mailto:` link pulled dynamically from the author's email
