# TMS Path Builder

The Path Builder is the control you use to tell a TMS Dynamic Field block **what data to display**. It's a step-by-step selector that builds a dot-separated "path" — a recipe for navigating from a post to the exact piece of data you want.

Think of it like a file path (`folder/subfolder/file.txt`) but for WordPress data: you start at a post, drill into its taxonomy terms, then pick a property of each term. No code required.

---

## Where you'll find it

The Path Builder appears in any TMS block that can pull dynamic data:

| Block | When it appears |
|---|---|
| **[Dynamic Field](dynamic-field.md)** | Always — this block's entire purpose is dynamic content. The Path Builder is in the **Settings** tab. |
| **[Heading](heading.md)** | When the **"Use dynamic content"** toggle is turned on in the Settings tab. |
| **[Paragraph](paragraph.md)** | When the **"Use dynamic content"** toggle is turned on in the Settings tab. |
| **[Img](img.md)** | When the **Source** dropdown is set to "Dynamic" (for the image URL). A second, simpler Path Builder also appears when the **Alt** dropdown is set to "Dynamic" (for alt text). |

In the Dynamic Field block, the Path Builder can also appear a second and third time for sub-paths — when the item type is URL/Link, you can set the **href source** to "URL from a different field" (a separate path for link targets) and the **link label** to "Dynamic" (a separate path for link text).

---

## How it works

### Step by step

You build a path by adding **steps**. Each step is a pair of dropdowns:

1. **Step type** (left dropdown) — what kind of data source are you navigating into?
2. **Value** (right dropdown) — which specific thing from that source?

The available values in the second dropdown change based on what you picked in the first, and also based on *what came before* in the path. For example, if a previous step was "Taxonomy terms → category," a later "Term property" step will show category-specific properties like name, slug, and archive URL.

> **Tip:** The right dropdown is **context-aware**. After an Author step, a "User property" step shows `display_name`, `email`, `url`, etc. After a Taxonomy terms step, a "Term property" step shows `name`, `slug`, `archive`, etc.

### The path string

As you build steps, the path builder automatically generates a compact string representation like `terms:category.term:name`. This is the internal format the block uses to resolve data. You'll see it in the debug info panel and in presets.

The format is: `stepType:value` for each step, joined by dots. Steps without a value (like `author` or `comments`) just use the type name.

---

## Step types reference

### Post property

Accesses a property of the current post (or the post from a Post Context / Query Loop).

| Property | What it returns |
|---|---|
| **Title** | The post title |
| **Slug** | The URL-friendly slug |
| **Date** | The published date |
| **Modified date** | The last modified date |
| **Excerpt** | The post excerpt (or auto-generated) |
| **Permalink** | Full URL to the post |
| **Comments link** | URL to the comments section |
| **ID** | The numeric post ID |
| **Featured image URL** | Full URL of the featured image |
| **Featured image alt** | Alt text of the featured image |
| **Attachment URL** | URL of the first attached media file |
| **Attachment alt** | Alt text of the first attached media file |
| **Caption** | The post excerpt used as a caption |

**Example:** `post:title` → displays the post title.

### Taxonomy terms

Grabs all terms of a specific taxonomy assigned to the post. This is a **multi-value** step — it returns all matching terms, not just one.

You pick the taxonomy: `category`, `post_tag`, or any custom taxonomy registered on your site.

After this step, you'll usually add a **Term property** step to choose what to display about each term (name, archive link, etc.).

**Example:** `terms:category.term:name` → displays all category names.

### Term property

Picks a specific property of a taxonomy term. Only appears after a `terms` or `parent` step.

| Property | What it returns |
|---|---|
| **Name** | The term's display name |
| **Slug** | The URL-friendly slug |
| **Description** | The term description |
| **Archive URL** | Full URL to the term's archive page |
| **Count** | Number of posts in this term |
| **ID** | The numeric term ID |

**Example:** `terms:post_tag.term:archive` → URLs to each tag's archive page.

### Author

Switches context to the post's author. After this step, you'll add a **User property** step to pick what to display.

**Example:** `author.user:display_name` → the author's display name.

### User property

Picks a specific property of a user (author). Only appears after an `author` step.

| Property | What it returns |
|---|---|
| **Display name** | The publicly shown name |
| **First name** | First name |
| **Last name** | Last name |
| **Nickname** | Nickname |
| **Email** | Email address |
| **URL** | Author's website URL |
| **Login** | Username / login |
| **Archive URL** | URL to the author's archive page |

**Example:** `author.user:email` → the author's email address.

### Comments count

Returns the number of approved comments on the post. No value to pick — just add this step.

**Example:** `comments` → displays `5` (or whatever the count is).

> **Tip:** Use the **Comments text** settings (singular/plural labels) in the Dynamic Field block to show "5 replies" instead of just "5".

### Meta field

Accesses a custom field (post meta / ACF field). Enter the field key or name manually. Works with text, URLs, image IDs, and multi-value fields.

**Example:** `meta:subtitle` → displays the value of the `subtitle` custom field.

### Link (URL)

Returns a URL without requiring a full path through terms or users. Useful as a shortcut for common link targets.

| Link type | What it returns |
|---|---|
| **Post permalink** | The current post's URL |
| **Post comments link** | URL to the post's comments |
| **Previous post URL** | URL of the previous post (by date) |
| **Next post URL** | URL of the next post (by date) |
| **Term archive URL** | Archive URL of the first term in context |
| **Author archive URL** | Archive URL of the post's author |
| **Author mailto:** | `mailto:` link for the author's email |

**Example:** `link:previous_post` → URL to the chronologically previous post.

### Parent term

Navigates to the *parent* of the current term in context. Only available when a previous step established a term context (after `terms`). After this step, you can add a **Term property** step.

**Example:** `terms:category.parent.term:name` → displays the parent category name of each assigned category.

---

## Using presets

At the top of the Path Builder, there's a **preset dropdown** with common configurations you can apply in one click:

| Preset | Path built |
|---|---|
| Post title | `post:title` |
| Post excerpt | `post:excerpt` |
| Post date | `post:date` |
| Post permalink | `post:permalink` |
| Featured image URL | `post:featured_image_url` |
| Comment count | `comments` |
| Author name | `author.user:display_name` |
| Author email | `author.user:email` |
| Categories | `terms:category.term:name` |
| Category archive URL | `terms:category.term:archive` |
| Tags | `terms:post_tag.term:name` |
| Custom field (meta) | Prompts for the meta key, then builds `meta:yourkey` |
| Term name | Prompts for the taxonomy, then builds `terms:yourtax.term:name` |

Just pick a preset, fill in any prompted value (taxonomy or meta key), and the path fills in automatically.

---

## Path resolution: how data flows

Here's what happens step by step when the block resolves a path at runtime:

```
Path: terms:category.term:name

Step 1 — "terms:category"
  → Get all categories assigned to this post
  → Result: [Term "Tutorials", Term "WordPress", Term "Plugins"]

Step 2 — "term:name"
  → For each term from Step 1, get its name
  → Result: ["Tutorials", "WordPress", "Plugins"]
```

```
Path: author.user:display_name

Step 1 — "author"
  → Get the post's author
  → Result: User object (ID 42)

Step 2 — "user:display_name"
  → Get the display_name property of that user
  → Result: "André Moreira"
```

```
Path: terms:category.parent.term:name

Step 1 — "terms:category"
  → Get all categories assigned to this post
  → Result: [Term "Plugins"]

Step 2 — "parent"
  → For each term, get its parent term
  → Result: [Term "Development"]

Step 3 — "term:name"
  → Get the name of each parent term
  → Result: ["Development"]
```

---

## Multi-value vs single-value

Some step types return **multiple values** (arrays), while others return a **single value**:

| Step type | Returns |
|---|---|
| `terms` (taxonomy terms) | Multiple — all assigned terms |
| `post` (post property) | Single — one value |
| `term` (term property) | Depends — multiple if preceded by `terms`, single if preceded by `parent` |
| `author` + `user` | Single — one author |
| `comments` | Single — one count |
| `meta` | Depends — single or multiple based on the field |
| `link` | Single — one URL |

When a step returns multiple values, the block outputs them as a list, separated by the **Separator** setting (default: `, `). The **Item type** and **Item tab** styles apply to each individual value.

---

## Tips

- **Start from presets.** The preset dropdown covers 90% of common use cases. Build from there rather than starting empty.
- **Add steps one at a time.** The right dropdown adapts to what came before — you can't pick "Term property" unless a `terms` or `parent` step precedes it.
- **Use the preview.** The preview area below the Path Builder shows live-resolved data so you can confirm the path is correct before publishing.
- **The path string is debuggable.** If something isn't resolving, check the path string in the Component Debug panel. It shows exactly what steps the block is trying to resolve.
- **Multi-value fields need separators.** If your taxonomy or meta field returns multiple items, make sure the **Separator** setting isn't empty (or the values will run together).
- **href paths have their own builder.** When using "URL from a different field," the href Path Builder works exactly the same way — build a separate path for the link targets.
- **Context is inherited.** The Path Builder respects Post Context and Query Loop context automatically. Inside a Query Loop, `post:title` shows each loop item's title, not the page's title.

---

## Common path recipes

| What you want | Path |
|---|---|
| Post title | `post:title` |
| Post publish date | `post:date` |
| Post excerpt | `post:excerpt` |
| Post permalink | `post:permalink` |
| Featured image URL | `post:featured_image_url` |
| Featured image alt text | `post:featured_image_alt` |
| Comment count | `comments` |
| Author display name | `author.user:display_name` |
| Author archive URL | `author.user:archive` |
| Author email (mailto) | `author.user:email` |
| Category names | `terms:category.term:name` |
| Category archive links | `terms:category.term:archive` |
| Tag names | `terms:post_tag.term:name` |
| Parent category name | `terms:category.parent.term:name` |
| Custom taxonomy term names | `terms:your_taxonomy.term:name` |
| ACF / custom field value | `meta:your_field_key` |
| Previous post URL | `link:previous_post` |
| Next post URL | `link:next_post` |
