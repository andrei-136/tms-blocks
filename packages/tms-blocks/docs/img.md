# TMS Img block

The TMS Img block displays an image. It gives you full control over where the image comes from, how it performs, and how it looks — all from the block sidebar. You can use an image from the media library, a direct URL, a dynamic field (like a featured image or custom field), or the context provided by a parent [Post Context](post-context.md).

## Settings sidebar

The settings sidebar has two tabs:

- **Wrapper** — Image source, alt text, size, performance, and attributes
- **Styles** — Image-specific visual appearance (object-fit, object-position)

---

### Wrapper tab

[SCREENSHOT: Wrapper tab]

#### Image source

Choose where the image comes from:

- **Library** — Pick an image from the WordPress media library. Use the "Select Image" button to open the media picker.
- **URL** — Enter a direct image URL (e.g. `https://example.com/photo.jpg`).
- **Dynamic** — Pull the image from a dynamic field path. Use this for featured images, custom fields, or any other dynamic image source.
- **Context** — Use the image from a parent Post Context block. For attachment posts, the attachment itself is displayed. For other post types, the post's featured image is used.

When a source is set, a thumbnail preview appears in the sidebar so you can confirm the right image is selected.

> **Note:** The **Context** source works inside a [Post Context](post-context.md) block, but it also works inside a Query Loop or archive template — anywhere a post context is naturally available. A warning only appears when no context is detected at all.

#### Alt text

Alt text describes the image for screen readers and appears when the image can't load. You have three options:

- **Media Library** — Uses the alt text stored in the media library. This is read-only in the block; edit it in the media library to update it everywhere.
- **Manual / Manual Override** — Type your own alt text directly in the block. This overrides the media library value and only applies to this specific block.
- **Dynamic** — Pull the alt text from a dynamic field path. Useful when the alt text should match the content it accompanies.

> **Tip:** Always provide meaningful alt text when the image conveys important information. Leave it empty only if the image is purely decorative.

#### Image size

Choose from the registered image sizes on your site — `thumbnail`, `medium`, `large`, `full`, and any custom sizes added by your theme. The default is `full`.

#### Performance

These settings control how the browser loads the image:

- **Loading** — `Lazy` (default) defers loading until the image is near the viewport. `Eager` loads it immediately. Use eager for images at the top of the page.
- **Decoding** — `Auto` (default) lets the browser decide. `Async` decodes the image off the main thread. `Sync` decodes it synchronously.
- **Fetch Priority** — Hint to the browser how important this image is. `High` for hero images, `Low` for footer images, or leave at `Default`.

#### ARIA Controls

- **ARIA Label** — An additional text description for screen readers, separate from the alt text.
- **Extra ARIA Attributes** — Add other `aria-*` attributes as key-value pairs.

#### Custom Attributes

Add your own HTML attributes to the `<img>` element:

- **`data-*` attributes** — for custom JavaScript, analytics, or styling hooks
- **`tabindex`** — to control keyboard focus order
- **`title`** — a tooltip that appears on hover

#### Identity Controls

- **ID** — Sets the `id` attribute on the image. Spaces are automatically converted to dashes.
- **CSS Class** — Add one or more custom CSS class names for targeting with custom stylesheets.

---

### Styles tab

The Styles tab for TMS Img focuses on image-specific styling. It includes the standard breakpoint selector and Base / Hover / Focus-Visible state tabs, with controls for:

- **Object Fit** — How the image fills its container: `fill`, `contain`, `cover`, `none`, or `scale-down`.
- **Object Position** — Where the image is anchored within its container (e.g. `center`, `top left`, `bottom right`).

These are the `object-fit` and `object-position` CSS properties — they control how an image behaves inside a sized container, similar to `background-size` and `background-position` but for `<img>` elements.

---

## Example HTML output

Here's what a TMS Img block might look like on the front end:

```html
<img
  id="hero-image"
  class="tmsblocks-img tmsblocks-img-abc789 hero"
  src="https://example.com/wp-content/uploads/hero-photo.jpg"
  alt="A person working at a laptop in a modern office"
  loading="eager"
  fetchpriority="high"
  decoding="async"
/>
```

And with styles configured in the Styles tab:

```css
body .tmsblocks-img-abc789 {
  object-fit: cover;
  object-position: center;
  width: 100%;
  height: 400px;
  border-radius: 8px;
}

@media (max-width: 767px) {
  body .tmsblocks-img-abc789 {
    height: 250px;
  }
}
```

> **Note:** The `abc789` in the class name is a unique ID that the block generates automatically.

## Tips

- **Use the Context source inside a Post Context block.** This is the easiest way to display a featured image that changes when you repoint the Post Context.
- **Set fetch priority to high for hero images.** The first large image on the page should load as quickly as possible.
- **Keep alt text meaningful.** Describe what's in the image, not just "logo" or "photo." Screen readers rely on this.
- **Object-fit is powerful for consistent layouts.** Use `cover` to make images fill a fixed-size container without distortion — great for card layouts and grids.
- **Combine with a TMS Link for clickable images.** Wrap a TMS Img inside a TMS Link to turn the image into a clickable link.

## Example uses

- a standard content image from the media library
- a featured image pulled dynamically from the current post
- a hero image with eager loading and high fetch priority
- an image inside a linked card (wrapped in a TMS Link)
- a context-aware image that changes with the Post Context block
