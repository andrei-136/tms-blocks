# TMS Block (Generic Block)

The TMS Block is the core structural block in the TMS Blocks plugin. Think of it as a smart, flexible wrapper — you pick the HTML tag, drop any other blocks inside it, and style it however you like. It works a lot like a `div` container you'd write by hand, but you control everything right from the block editor sidebar.

You can use it on its own or as a building block inside a [Post Context](post-context.md). It supports inner blocks, so you can nest headings, paragraphs, images, links, lists, and more — all inside a single semantic wrapper.

## Settings sidebar

When you select a TMS Block in the editor, the settings sidebar has two tabs:

- **Wrapper** — Everything about the HTML element itself
- **Styles** — Visual appearance (see [The Styles tab](styles.md) for full details)

---

### Wrapper tab

The Wrapper tab controls the HTML element that wraps your inner blocks.

[SCREENSHOT: Wrapper tab]

#### Element Tag

Choose the HTML tag for the wrapper element. The default is `div`, but you can pick from a list of semantic tags:

- **Div** — a generic container (default)
- **Section** — a thematic grouping of content
- **Header** — introductory content or navigation
- **Footer** — footer content for its nearest section
- **Aside** — tangentially related content (like a sidebar)
- **Nav** — a section with navigation links
- **Main** — the dominant content of the page
- **Article** — a self-contained composition
- **Figure** — self-contained content like an illustration or diagram

> **Tip:** Pick the tag that best describes the *meaning* of the content, not just how it's going to look. A card might be an `article`, a sidebar might be an `aside`, and a group of navigation links should probably be a `nav`.

#### ARIA Controls

These help make your content more accessible to screen readers and assistive technology.

- **ARIA Label** — A text description of the element for screen readers. Useful when the element's purpose isn't obvious from its visible content.
- **Role** — Overrides the implicit ARIA role of the element. Choose from common landmark and widget roles like `banner`, `navigation`, `region`, `alert`, `dialog`, and more.
- **Extra ARIA Attributes** — Add any other `aria-*` attributes you need, such as `aria-hidden`, `aria-expanded`, `aria-live`, or `aria-describedby`. Each one is a key-value pair.

#### Custom Attributes

Add your own HTML attributes to the wrapper element. This is useful for:

- **`data-*` attributes** — for custom JavaScript, analytics, or styling hooks (e.g. `data-theme="dark"`, `data-id="123"`)
- **`tabindex`** — to control keyboard focus order
- **`title`** — a tooltip that appears on hover
- **`download`** — when used on an anchor-like wrapper, suggests the linked resource should be downloaded

Each attribute is a key-value pair. You can add as many as you need.

#### Identity Controls

- **ID** — Sets the `id` attribute on the HTML element. This can be used for anchor links, JavaScript targeting, or CSS specificity. Spaces are automatically converted to dashes.
- **CSS Class** — Add one or more custom CSS class names to the element. These are useful for targeting the block with custom stylesheets or utility frameworks.

---

## Example HTML output

Here's what a TMS Block might look like on the front end after you configure it:

```html
<section
  id="features"
  class="tmsblocks-generic-block tmsblocks-generic-block-abc123 features-section"
  aria-label="Product features section"
  role="region"
  data-theme="light"
>
  <h2>What You Get</h2>
  <p>Every plan includes all of the core features…</p>
  <ul>
    <li>Unlimited projects</li>
    <li>Priority support</li>
    <li>Advanced reporting</li>
  </ul>
</section>
```

And here is the corresponding inline CSS that the block generates automatically:

```css
body .tmsblocks-generic-block-abc123 {
  margin-top: 40px;
  margin-bottom: 40px;
  padding: 32px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

@media (hover: hover) and (pointer: fine) {
  body .tmsblocks-generic-block-abc123:hover {
    background-color: #e8e8e8;
  }
}

@media (max-width: 767px) {
  body .tmsblocks-generic-block-abc123 {
    margin-top: 20px;
    margin-bottom: 20px;
    padding: 16px;
  }
}
```

> **Note:** The `abc123` in the class name is a unique ID that the block generates automatically. Every TMS Block on your page gets its own unique class so that styles don't leak between blocks.

## Tips

- **Pick the right tag.** A card is usually an `article`, a sidebar is usually an `aside`, and a page section is usually a `section`. The tag you choose adds meaning for search engines and screen readers.
- **Use the breakpoint selector early.** Before adding lots of styles, switch to Tablet or Mobile to make sure your design works at every screen size.
- **Keep hover styles subtle.** A gentle color shift or a small shadow change is usually more effective than dramatic transformations.
- **Nest blocks for complex layouts.** You can put a TMS Block inside another TMS Block to create multi-level structures.
- **The unique class name is your friend.** If you need to target a specific block with custom CSS, you can inspect the page to find its auto-generated class.

## Example uses

- a **card container** — an `article` with padding, a background color, rounded corners, and a heading + paragraph + link inside
- a **page section** — a `section` with top and bottom margin, a background, and multiple content blocks nested inside
- a **sticky header bar** — a `header` with `position: sticky`, a background, and a navigation block inside
- a **responsive grid item** — a `div` with flex or grid properties that adapt at different breakpoints
- an **accessible region** — a `section` with an `aria-label` and `role="region"` for screen reader navigation
