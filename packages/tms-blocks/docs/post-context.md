# Post Context block

The Post Context block is like a simpler Query Loop — but for a single post. You wrap a group of dynamic blocks inside it, pick one post, and every child block reads from that post automatically.

## Why it's useful

Each dynamic block (TMS Heading, TMS Paragraph, TMS Link, TMS Img, TMS Dynamic Field) already lets you pick a specific post to pull from — using the **Post source** setting set to "specific." So you could build a card with an image, heading, paragraph, and link, and configure each one individually to point at the same post.

But if you later want to point that card at a different post, you'd need to update every block one by one. With Post Context, you set the post **once** in the wrapper, and all child blocks follow. Change the post in one place, and the entire card updates.

This also makes layouts reusable: build a card pattern once — say a figure with a dynamic image, a dynamic heading as the caption, and a link wrapping the whole thing — then copy it and change only the Post Context to point to different posts.

## How it works

When you select a post, the block provides that post's ID and type as **context** to every child block inside it. Any TMS block that supports dynamic content will automatically read from the selected post instead of the current page.

On the front end, the block renders a wrapper element — the tag you chose in the settings — with its CSS classes, styles, and attributes, containing your inner blocks. The wrapper is a real HTML element, so you can style it, give it an ID, or use it as a layout container.

If no post is selected, the block outputs nothing at all.

## Settings sidebar

The settings sidebar has two tabs:

- **Wrapper** — Post selection and attributes
- **Styles** — Visual appearance of the wrapper element (see [The Styles tab](styles.md))

---

### Wrapper tab

[SCREENSHOT: Wrapper tab]

#### Post Type

Choose the type of content you want to pull from — posts, pages, or any custom post type registered on your site. Changing the post type resets the selected post.

#### Post Selector

Once you've chosen a post type, use the search field to find and select a specific post. After selecting, a preview card appears showing the post's title, type, and status so you can confirm you picked the right one.

For **attachment** post types, the selector becomes a media picker instead of a text search.

> **Important:** If no post is selected, a warning appears in the sidebar and child blocks will receive no context. On the front end, the entire Post Context block outputs nothing.

#### Element Tag

Choose the HTML tag for the wrapper element. The default is `div`, with the same semantic tag options as the TMS Block — `section`, `article`, `header`, `footer`, `aside`, `nav`, `main`, and `figure`.

> **Tip:** Use `div` when the wrapper is purely structural. Use `section` or `article` when the content has independent meaning.

#### ARIA Controls

- **ARIA Label** — A text description of the wrapper for screen readers.
- **Role** — Override the implicit ARIA role.
- **Extra ARIA Attributes** — Add other `aria-*` attributes as key-value pairs.

#### Custom Attributes

Add your own HTML attributes to the wrapper element:

- **`data-*` attributes** — for custom JavaScript, analytics, or styling hooks
- **`tabindex`** — to control keyboard focus order
- **`title`** — a tooltip that appears on hover

#### Identity Controls

- **ID** — Sets the `id` attribute on the wrapper. Spaces are automatically converted to dashes.
- **CSS Class** — Add one or more custom CSS class names for targeting with custom stylesheets.

---

## Example HTML output

Here's what a Post Context block might look like on the front end with a dynamic heading and paragraph inside it:

```html
<div
  class="tmsblocks-post-context tmsblocks-post-context-abc789 related-card"
>
  <h2 class="tmsblocks-heading tmsblocks-heading-def456">
    Getting Started with TMS Blocks
  </h2>
  <p class="tmsblocks-paragraph tmsblocks-paragraph-ghi123">
    Learn how to build clean, structured content using blocks for text,
    images, lists, and dynamic content.
  </p>
  <a
    href="https://example.com/getting-started"
    class="tmsblocks-anchor tmsblocks-anchor-jkl012"
  >
    <span>Read more</span>
  </a>
</div>
```

In this example, the heading, paragraph, and link all read from the post selected in the Post Context block. Change the post once in the Post Context settings, and all three blocks update together.

## Tips

- **Set the post once, not per block.** Without Post Context, you'd need to set the post source on every dynamic block individually. With it, one change updates everything inside.
- **Build reusable card patterns.** Create a layout with a dynamic image, heading, and link — all wrapped in a Post Context. Copy the whole thing and just change the selected post to create another card.
- **No post selected = nothing shown.** If you leave the post selector empty, the block outputs nothing on the front end. Make sure to pick a post before publishing.
- **Use `figure` as the wrapper tag for image/caption cards.** A common pattern is a Post Context with `tagName` set to `figure`, containing a dynamic image and a TMS Paragraph set to `figcaption`.
- **The Styles tab works the same as other blocks.** See [The Styles tab](styles.md) for full details on breakpoints, state tabs, and all available style panels.

## Example uses

- a featured post card pointing to a hand-picked article
- a figure/img/caption pattern where the image and caption both pull from the same post
- a set of post cards, each in its own Post Context pointing to different posts
- a related reading section where you can swap the post in one place
- a reusable card template — build once, duplicate, and repoint each copy
