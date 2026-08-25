=== TMS Blocks ===
Contributors: terriblemonster
Tags: custom fields, dynamic content, post meta, responsive blocks, gutenberg blocks
Requires at least: 6.3
Tested up to: 7.0
Stable tag: 1.1.0
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Gutenberg blocks for dynamic content and custom fields, designed for block themes and full-site editing.

== Description ==
TMS Blocks adds a focused set of blocks to the WordPress block editor. Each block is designed to produce clean, predictable HTML with full styling control built in, no page builder required.

The plugin currently includes the following blocks:
* TMS Block: semantic wrapper with your choice of HTML tag
* TMS Heading: H1–H6 with dynamic content support
* TMS Paragraph: body text with truncation and dynamic content
* TMS Link: anchor block with dynamic URL and label support
* TMS Image: images from the media library, URL, or dynamic field
* TMS List / List Item: ordered and unordered lists
* TMS Dynamic Field: output post data, custom fields, and taxonomy terms
* Post Context: point child blocks at a specific post

= Styling =
Every block includes a Styles tab with breakpoint controls for desktop, tablet, and mobile. Each breakpoint has independent base, hover, and focus-visible states. The CSS+ tab lets you add custom selectors with full style controls per selector.

= Dynamic content =

The Dynamic Field block and path builder let you pull post titles, dates, custom fields, taxonomy terms, author info, and more, with no additional plugins required.

= Built for block themes =

Blocks render server-side where needed and produce minimal markup. Designed to work with block themes and full-site editing without adding page-builder overhead. 



= Requirements =

* WordPress 6.3 or higher
* PHP 7.4 or higher
* The block editor (Gutenberg); Classic Editor is not supported

== Installation ==
1. Upload the plugin files to the /wp-content/plugins/tms-blocks directory, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the \'Plugins\' screen in WordPress.

== Changelog ==

= 1.1.0 =
* Added: Custom CSS Selectors feature (CSS+ tab) — add arbitrary selectors (&:hover, &::before, & ul li) with full StyleControls per selector
* Added: Transition controls for custom selectors with per-property duration/easing/delay overrides
* Added: Content controls for pseudo-element selectors — auto-quotes bare strings, stores as composite object (source + derived CSS value)
* Added: Frontend PHP rendering for custom selector styles via wp_add_inline_style
* Added: Selector sanitization — strips {, }, ; characters; auto-prepends & if missing
* Fixed: Tab overflow in BreakpointStateTabs with many tabs
* Fixed: React error #185 ("Maximum update depth exceeded") when duplicating multiple TMS blocks simultaneously
* Added Post/Page link source option to Anchor block with searchable picker (stores ID, resolves via permalink)
* Anchor block link source now uses three-way selector: Post/Page, URL, Dynamic (backward compatible)
* Fixed: List Item block now creates a new list item on Enter instead of line break
* Fixed: Flex/Grid Item button no longer shows orange override dot on standalone (non-component) blocks
* Paragraph block: enabled link format (core/link) in RichText toolbar
* Changed: Paragraph block now splits via the block.json splitting support instead of the deprecated onSplit RichText prop
* Display & Layout panel: overflow now splits into overflow-x / overflow-y with linked toggle (same pattern as padding/margin)* Changed: Size and font-size preset selectors now use a dropdown when more than 4 presets are available, preventing button overflow
* Fixed: custom appender (+) button no longer shows inside locked component instances where inner blocks cannot be added

= 1.0.4 =
* Added template variable support in Anchor block href ({{page_url}}, {{post_url}}, {{site_url}})
* Fixed: title attribute set via Custom Attributes on Img block now renders on frontend
* Added override indicator store (shared) for component-system dot colors
* Added attrKey prop to PanelTitle and ControlLabel for override-aware dot coloring
* Component instance overrides now show orange indicator dots in block controls
* Bumped dependency: tms-component-system now populates override dot color store
* Fixed priority bug in dynamic path resolver when placed inside query loop


= 1.0.3 =
* Fixed unexpected output error during activation

= 1.0.2 =
* Tested up to WordPress 7.0

= 1.0 =
* Initial release.

== Development ==

The source code for this plugin, including unminified assets, is available at:
https://github.com/andrei-136/tms-blocks

