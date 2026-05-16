<?php
/**
 * Server-side render for the Generic block.
 * 
 * phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound
 * phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.InvalidPrefixPassed
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}



    // -- Early exit -----------------------------------------------------------

    if ( isset( $attributes['renderBlock'] ) && ! $attributes['renderBlock'] ) {
        return;
    }

    // -- Block identity -------------------------------------------------------

    $block_name  = isset( $block->name ) ? $block->name : '';
    $block_slug  = strpos( $block_name, '/' ) !== false
        ? substr( $block_name, strrpos( $block_name, '/' ) + 1 )
        : $block_name;

    $unique_id         = $attributes['uniqueId'] ?? '';
    $block_class_name  = ! empty( $block_slug ) ? "tmsblocks-{$block_slug}" : '';
    $unique_class_name = ! empty( $unique_id )
        ? sanitize_html_class( "tmsblocks-{$block_slug}-{$unique_id}" )
        : '';

    // -- Attribute extraction -------------------------------------------------

    $tag         = tag_escape( $attributes['tagName'] ?? 'div' );
    $anchor_id   = trim( $attributes['anchorId'] ?? '' );
    $tmsblocks_class   = trim( preg_replace( '/\s+/', ' ', $attributes['tmsClassName'] ?? '' ) );
    $aria_label  = trim( $attributes['ariaLabel'] ?? '' );
    $aria_role   = trim( $attributes['ariaRole'] ?? '' );

    // -- Custom styles --------------------------------------------------------

    $custom_style               = tmsblocks_process_custom_styles( $attributes['customStyle'] ?? [] );
    $custom_style_hover         = tmsblocks_process_custom_styles( $attributes['customStyleHover'] ?? [] );
    $custom_style_focus_visible = tmsblocks_process_custom_styles( $attributes['customStyleFocusVisible'] ?? [] );

    // -- Custom attributes ----------------------------------------------------

    $extra_attrs = '';

    // data-*, tabindex, title - require a value
    $custom_attrs_raw = $attributes['customAttributes'] ?? [];
    if ( is_array( $custom_attrs_raw ) ) {
        foreach ( $custom_attrs_raw as $attr ) {
            $key = isset( $attr['key'] ) ? trim( $attr['key'] ) : '';
            $val = isset( $attr['value'] ) ? $attr['value'] : '';

            if ( empty( $key ) ) {
                continue;
            }

            // download is optionally valued - output as boolean when empty
            if ( $key === 'download' ) {
                $extra_attrs .= empty( $val ) || $val === 'true'
                    ? ' download'
                    : ' download="' . esc_attr( $val ) . '"';
                continue;
            }

            if (
                preg_match( '/^data-[a-z0-9-]+$/', $key ) ||
                in_array( $key, [ 'tabindex', 'title' ], true )
            ) {
                $extra_attrs .= ' ' . esc_attr( $key ) . '="' . esc_attr( $val ) . '"';
            }
        }
    }

    // Extra aria-* attributes
    $extra_aria_raw = $attributes['extraAriaAttributes'] ?? [];
    if ( is_array( $extra_aria_raw ) ) {
        foreach ( $extra_aria_raw as $attr ) {
            $key = isset( $attr['key'] ) ? trim( $attr['key'] ) : '';
            $val = isset( $attr['value'] ) ? trim( $attr['value'] ) : '';

            if ( empty( $key ) || empty( $val ) ) {
                continue;
            }

            if ( ! preg_match( '/^aria-[a-z-]+$/', $key ) ) {
                continue;
            }

            $extra_attrs .= ' ' . esc_attr( $key ) . '="' . esc_attr( $val ) . '"';
        }
    }

    // -- Build class list -----------------------------------------------------

    $all_classes = array_filter( [ $block_class_name, $tmsblocks_class, $unique_class_name ] );

    /**
     * Filters the CSS class array for any TMS block.
     *
     * @param array    $all_classes  The class list before being joined into a string.
     * @param array    $attributes   The block attributes.
     * @param WP_Block $block        The block instance.
     */
    $all_classes = apply_filters( 'tmsblocks/block_classes', $all_classes, $attributes, $block );

    /**
     * Filters the CSS class array for a specific TMS block (e.g. tmsblocks/generic).
     *
     * @param array    $all_classes  The class list before being joined into a string.
     * @param array    $attributes   The block attributes.
     * @param WP_Block $block        The block instance.
     */
    $all_classes = apply_filters( "tmsblocks/block_classes/{$block_slug}", $all_classes, $attributes, $block );

    // -- Build attributes map -------------------------------------------------

    $attrs_map = [];

    if ( ! empty( $anchor_id ) )   { $attrs_map['id'] = $anchor_id; }
    if ( ! empty( $all_classes ) ) { $attrs_map['class'] = implode( ' ', $all_classes ); }
    if ( ! empty( $aria_label ) )  { $attrs_map['aria-label'] = $aria_label; }
    if ( ! empty( $aria_role ) )   { $attrs_map['role'] = $aria_role; }

    /**
     * Filters attributes for a specific TMS block before assembly.
     *
     * Values are unescaped plain strings at this point.
     *
     * @param array    $attrs_map   Associative array of attribute name => value.
     * @param array    $attributes  The block attributes.
     * @param WP_Block $block       The block instance.
     */
    $attrs_map = apply_filters( "tmsblocks/block_attrs/{$block_slug}", $attrs_map, $attributes, $block );

    /**
     * Filters attributes for any TMS block before assembly.
     *
     * Values are unescaped plain strings at this point.
     *
     * @param array    $attrs_map   Associative array of attribute name => value.
     * @param array    $attributes  The block attributes.
     * @param WP_Block $block       The block instance.
     */
    $attrs_map = apply_filters( 'tmsblocks/block_attrs', $attrs_map, $attributes, $block );

    // -- Assemble escaped attribute string ------------------------------------

    $attrs = '';
    if ( is_array( $attrs_map ) ) {
        foreach ( $attrs_map as $attr_name => $attr_value ) {
            if ( ! preg_match( '/^[a-zA-Z][a-zA-Z0-9_:-]*$/', (string) $attr_name ) ) {
                continue;
            }

            if ( ! is_scalar( $attr_value ) ) {
                continue;
            }

            $attrs .= ' ' . esc_attr( (string) $attr_name ) . '="' . esc_attr( (string) $attr_value ) . '"';
        }
    }
    if ( ! empty( $extra_attrs ) ) { $attrs .= $extra_attrs; } // $extra_attrs is already escaped above

    // -- Inline styles --------------------------------------------------------

    $handle   = tmsblocks_get_styles_handle();
    $all_css  = '';

    if ( $custom_style && $unique_class_name ) {
        $all_css .= "body .{$unique_class_name} { {$custom_style} }\n";
    }
    if ( $custom_style_hover && $unique_class_name ) {
        $all_css .= "@media (hover: hover) and (pointer: fine) { body .{$unique_class_name}:hover { {$custom_style_hover} } }\n";
    }
    if ( $custom_style_focus_visible && $unique_class_name ) {
        $all_css .= "body .{$unique_class_name}:focus-visible { {$custom_style_focus_visible} }\n";
    }

    $responsive_css = tmsblocks_process_responsive_styles(
        $attributes['responsiveStyle']     ?? [],
        $unique_class_name,
        $attributes['breakpointOverrides'] ?? [],
        $attributes['customBreakpoints']    ?? []
    );
    if ( $responsive_css ) {
        $all_css .= $responsive_css;
    }

    if ( $all_css ) {
        tmsblocks_add_inline_style_once( $handle, $all_css );
    }

    // -- Output ---------------------------------------------------------------

    // Security boundary: the wrapper tag is hardened with tag_escape(). Attribute
    // values are filtered as a structured array before assembly, then individually
    // escaped with esc_attr() — event handler attributes (on*) are blocked at
    // assembly time. $content is WordPress-core-rendered inner block HTML; applying
    // wp_kses() would strip legitimate nested markup so it is intentionally
    // left as-is, matching the pattern used by core/group and core/columns.
    $tag = tag_escape( $tag );
    // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
    echo "<{$tag}{$attrs}>" . $content . "</{$tag}>"; 