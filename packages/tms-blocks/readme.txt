=== TMS Blocks ===
Contributors: terriblemonster
Tags: blocks, gutenberg, custom-blocks
Requires at least: 6.3
Tested up to: 7.0
Stable tag: 1.0.4
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A set of custom Gutenberg blocks for WordPress.

== Description ==
TMS Blocks adds custom blocks for the WordPress block editor (Gutenberg).

The blocks are meant to act like a transparent interface for the html and css produced by them. 

The plugin currently includes the following blocks:
- Link
- Dynamic Field
- Generic Block
- Heading
- Image
- List
- List Item
- Paragraph
- Post Context

These blocks are used to define content structure and render block output in a predictable way. 

= Key Features =

- Block collection focused on text, media, list, anchor, and context-aware output use cases
- Dynamic field rendering for displaying values from configured sources
- Server-rendered output for selected blocks where runtime data is required
- Editor support for configuring block-specific settings through block attributes


= Requirements =

- WordPress 6.3 or higher
- PHP 7.4 or higher
- The block editor (Gutenberg); Classic Editor is not supported

== Installation ==
1. Upload the plugin files to the /wp-content/plugins/tms-blocks directory, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the \'Plugins\' screen in WordPress.

== Changelog ==

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

