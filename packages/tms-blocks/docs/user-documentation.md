# TMS Blocks

TMS Blocks is a collection of custom blocks for the WordPress block editor. It is designed to help you build clean, structured content using blocks for text, images, lists, links, and dynamic content.

The plugin focuses on practical editing tools instead of complicated page-building workflows. You can create content visually in the editor, adjust styling when needed, and use dynamic values in places where content should update automatically.

TMS Blocks currently includes blocks for:

- links and anchors
- paragraphs and headings
- images
- lists and list items
- dynamic field output
- post context and reusable content structure

If you are already comfortable using the WordPress block editor, TMS Blocks should feel familiar. Each block is built to work inside normal editing flows while giving you more control over output and presentation.

## Getting started

After activating the plugin, open any post or page in the block editor and search for the block you want to add. Most blocks can be inserted from the block inserter and then customized from the sidebar settings.

A simple way to begin is:

1. add a text or media block from TMS Blocks
2. adjust the content in the editor canvas
3. open the sidebar to configure settings such as styles, identity, or dynamic content
4. preview the page and confirm the result

## TMS Link (Anchor) block

The TMS Link block lets you create a clickable link with a visible label, nested blocks, and advanced settings for URL behavior. It can be used for simple text links, links that contain inner blocks, or links that pull their URL or label dynamically.

This block is useful when you want more control than a standard inline link.

### When to use it

Use the TMS Link block when you want to:

- add a stand-alone link in your layout
- link to another page, file, or section
- create a link that contains text and other inner blocks
- set the link label manually or dynamically
- pull the URL from dynamic data

### How it works

The block has two main parts:

- the **URL**: where the link goes
- the **label**: the visible text or content people click

These are handled separately. Setting a URL does not automatically create a label. You can type the label directly in the block, insert inner blocks, or enable a dynamic label.

### Common settings

#### Link settings

Use these options to control the destination and behavior of the link:

- **Link (href)**: set a manual URL
- **Use dynamic link**: pull the URL from dynamic data instead of typing it manually
- **Target**: choose whether the link opens in the same tab or a new tab
- **REL**: add common link relationship values such as `nofollow` or `noopener`
- **Referrer Policy**: control how referrer information is shared

#### Label options

You can choose how the visible label is created:

- type text directly into the block
- insert inner blocks inside the link
- enable **Use dynamic label** to pull the label from dynamic data

This makes it possible to have both simple links and more advanced linked content in the same block.

### Tips

- If the link has a URL but no visible label, visitors will not see anything to click.
- Use a clear, descriptive label such as "Read more", "View project", or the title of the destination.
- Open links in a new tab only when it improves the user experience.
- If you are using dynamic values, preview the page to confirm the correct content is being pulled.

### Example uses

- a button-style text link to another page
- a linked card containing text blocks inside it
- a dynamic author or post link pulled from site data
- a jump link to a section on the same page

## TMS Dynamic Field block

The TMS Dynamic Field block displays content pulled from the current post, query context, or another selected source. It is especially useful when you want information to update automatically instead of typing it by hand.

You can use it to output text, images, or links based on dynamic data from your site.

### When to use it

Use the TMS Dynamic Field block when you want to:

- display post-related data automatically
- show custom field values in your layout
- output names, dates, taxonomy terms, or other context-aware content
- build reusable templates that update per post or per query item
- create dynamic links or images without editing each page manually

### How it works

The block uses a field path builder to choose what content should be displayed. Once the path is set, the block shows a preview in the editor and renders the matching value on the front end.

Depending on your setup, the block can output:

- **text**
- **image**
- **URL / link**

This makes it flexible for everything from simple metadata to linked dynamic content.

### Common settings

#### Data source

These options control what value the block displays:

- **Path / steps**: choose the dynamic field you want to show
- **Post source**: use the current post context or a specific post
- **Preview**: check what value is currently being resolved
- **Preview limit**: limit how many results are shown in the editor preview

#### Item type

The block can format the output in different ways:

- **Text**: display plain text or formatted text output
- **Image**: display an image from a dynamic source
- **URL / Link**: turn the dynamic value into a clickable link

#### Link options

If you choose the **URL / Link** item type, you can also control:

- where the link URL comes from
- whether the visible label is static or dynamic
- whether the link opens in the same tab or a new tab

### Tips

- Start by confirming the preview shows the value you expect.
- If nothing appears, check the selected field path and post source.
- Use this block inside templates or query-based layouts when you want content to update automatically.
- For links, make sure both the destination and label make sense for the visitor.

### Example uses

- showing the current post date or modified date
- outputting a custom field such as a subtitle or external URL
- listing taxonomy terms from the current post
- creating a dynamic author or archive link
- displaying a featured or related image from dynamic content

## TMS Paragraph block

The TMS Paragraph block is used for normal body text. It works much like the standard WordPress paragraph block, but it also includes extra styling options and support for dynamic content.

### When to use it

Use the TMS Paragraph block when you want to:

- write regular paragraph text
- add dynamic text from post data or custom fields
- control truncation for previews or excerpts
- apply more advanced styling than the default paragraph block

### Common settings

- **Content**: write the paragraph text directly in the editor
- **Use dynamic content**: pull the text from a dynamic source
- **Separator / Empty text**: control how multiple values or empty results are handled
- **Truncation**: shorten the displayed text when needed

### Tips

- Use manual text for normal page copy.
- Use dynamic content when building templates or post-based layouts.
- Truncation is especially useful for previews, summaries, or archive listings.

### Example uses

- intro text on a page
- a dynamic subtitle pulled from a custom field
- a shortened description in a listing layout

## TMS Heading block

The TMS Heading block is used for titles and section headings. It gives you control over the heading level and supports both manual and dynamic content.

### When to use it

Use the TMS Heading block when you want to:

- add clear section headings to a page
- display a post title or another dynamic value as a heading
- choose the correct heading level for structure and accessibility

### Common settings

- **Heading level**: choose `H1` to `H6`
- **Content**: type the heading manually or enable dynamic content
- **Span class**: add extra styling hooks when needed
- **Identity and style controls**: manage appearance and attributes

### Tips

- Use heading levels in order to keep pages well structured.
- Reserve `H1` for the main page or post title when appropriate.
- Dynamic headings work well in templates and reusable layouts.

### Example uses

- a page section title
- a dynamically pulled post title
- a styled featured heading in a content block

## TMS Img block

The TMS Img block displays an image with more control over the source, loading behavior, and dynamic image data. It can use an image from the media library, a direct URL, or a dynamic source.

### When to use it

Use the TMS Img block when you want to:

- insert a standard image into your content
- display an image from dynamic post data
- control alt text and loading settings more directly
- combine images with other TMS blocks in custom layouts

### Common settings

- **Image source**: choose the media library, URL, or dynamic source
- **Image size**: select the size to display
- **Alt text**: define descriptive alternative text
- **Loading / decoding / fetch priority**: adjust performance-related behavior

### Tips

- Always provide meaningful alt text when the image adds important information.
- Use lazy loading for regular content images unless there is a reason not to.
- Preview dynamic images to make sure the correct source is being used.

### Example uses

- a standard content image
- a featured image pulled dynamically from a post
- an image used inside a linked card or custom layout

## TMS List block

The TMS List block creates an ordered or unordered list and is designed to work with TMS List Item blocks inside it.

### When to use it

Use the TMS List block when you want to:

- create bullet lists or numbered lists
- build styled lists with more control over output
- structure grouped items clearly in the editor

### Common settings

- **List type**: choose an unordered list (`ul`) or ordered list (`ol`)
- **Inner items**: add and arrange TMS List Item blocks inside the list
- **Style controls**: adjust the appearance of the list wrapper

### Tips

- Use unordered lists for general grouped information.
- Use ordered lists for steps, rankings, or sequences.
- Keep list items short and easy to scan when possible.

### Example uses

- a feature list
- a step-by-step set of instructions
- a styled list of links or resources

## TMS List Item block

The TMS List Item block is used inside the TMS List block. Each item can contain its own text and, depending on the layout, nested inner blocks.

### When to use it

Use the TMS List Item block when you want to:

- add or edit individual list entries
- create more flexible list content
- style items separately from the list wrapper

### Common settings

- **Content**: type the item text directly
- **Inner blocks**: add nested content where needed
- **Style and identity settings**: customize each item individually

### Tips

- Use this block inside a TMS List for best results.
- Keep each item focused on a single idea.
- Use nested content only when the list item needs more structure.

### Example uses

- one point in a benefits list
- one step in a process list
- a list item containing extra descriptive content

## TMS Block (Generic Block)

The TMS Block is a flexible wrapper block for creating semantic HTML containers with inner content. It is useful when you need a general-purpose structural block that is not tied to a specific content type.

### When to use it

Use the TMS Block when you want to:

- group content inside a semantic wrapper such as a `div`, `section`, or other tag
- build custom layouts with inner blocks
- apply shared styles or attributes to a content area

### Common settings

- **Tag name**: choose the HTML wrapper element
- **Inner blocks**: place other blocks inside it
- **Identity and style controls**: manage classes, attributes, and presentation

### Tips

- Choose the wrapper tag based on the meaning of the content, not just appearance.
- Use this block as a structural building block in more advanced layouts.
- Combine it with Heading, Paragraph, Image, and Link blocks for reusable sections.

### Example uses

- a custom content section wrapper
- a styled card container
- a semantic grouping for related blocks

## Post Context block

The Post Context block provides a selected post context to the blocks inside it. This is especially useful when using dynamic blocks that should pull data from a specific post instead of the current page.

### When to use it

Use the Post Context block when you want to:

- make child blocks use a specific post as their data source
- build reusable templates for featured or related content
- combine dynamic blocks inside a controlled content context

### How it works

The block acts as a wrapper. You place other blocks inside it, and those child blocks can then read data from the post selected in the Post Context settings.

This is most useful with blocks like:

- **TMS Dynamic Field**
- **TMS Link**
- **TMS Img**
- **TMS Heading**
- **TMS Paragraph**

### Common settings

- **Post type**: choose which type of content to use
- **Post ID**: set the specific post for the context
- **Inner blocks**: place the dynamic content blocks inside the wrapper

### Tips

- Use Post Context when you want a group of blocks to all reference the same post.
- This is especially helpful in templates, related content sections, or manually curated featured areas.
- If dynamic content looks incorrect, check the selected post source first.

### Example uses

- a featured post card built from dynamic blocks
- a manually selected related content section
- a custom layout that pulls title, image, and link from another post

## Next steps

This documentation now covers the main blocks currently available in the plugin. It can be expanded later with setup guides, styling walkthroughs, and practical examples for common layouts.
