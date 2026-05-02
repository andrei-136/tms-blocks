<?php
/**
 * Server-side render for the List block.
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
    $unique_class_name = ! empty( $unique_id ) ? "tmsblocks-{$block_slug}-{$unique_id}" : '';

    // -- Attribute extraction -------------------------------------------------

    $tag             = in_array( $attributes['tagName'] ?? 'ul', [ 'ul', 'ol' ], true ) ? $attributes['tagName'] : 'ul';
    $anchor_id       = trim( $attributes['anchorId']  ?? '' );
    $tmsblocks_class = trim( preg_replace( '/\s+/', ' ', $attributes['tmsClassName'] ?? '' ) );
    $aria_label      = trim( $attributes['ariaLabel'] ?? '' );
    $aria_role       = trim( $attributes['ariaRole']  ?? '' );

    // -- Custom styles --------------------------------------------------------

    $custom_style               = tmsblocks_process_custom_styles( $attributes['customStyle']             ?? [] );
    $custom_style_hover         = tmsblocks_process_custom_styles( $attributes['customStyleHover']        ?? [] );
    $custom_style_focus_visible = tmsblocks_process_custom_styles( $attributes['customStyleFocusVisible'] ?? [] );

    // -- Custom attributes ----------------------------------------------------

    $extra_attrs = '';

    $custom_attrs_raw = $attributes['customAttributes'] ?? [];
    if ( is_array( $custom_attrs_raw ) ) {
        foreach ( $custom_attrs_raw as $attr ) {
            $key = isset( $attr['key'] ) ? trim( $attr['key'] ) : '';
            $val = isset( $attr['value'] ) ? $attr['value'] : '';

            if ( empty( $key ) ) continue;

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

    $extra_aria_raw = $attributes['extraAriaAttributes'] ?? [];
    if ( is_array( $extra_aria_raw ) ) {
        foreach ( $extra_aria_raw as $attr ) {
            $key = isset( $attr['key'] ) ? trim( $attr['key'] ) : '';
            $val = isset( $attr['value'] ) ? trim( $attr['value'] ) : '';

            if ( empty( $key ) || empty( $val ) ) continue;
            if ( ! preg_match( '/^aria-[a-z-]+$/', $key ) ) continue;

            $extra_attrs .= ' ' . esc_attr( $key ) . '="' . esc_attr( $val ) . '"';
        }
    }

    // -- Build class list -----------------------------------------------------

    $all_classes = array_filter( [ $block_class_name, $tmsblocks_class, $unique_class_name ] );
    $all_classes = apply_filters( 'tmsblocks/block_classes',               $all_classes, $attributes, $block );
    $all_classes = apply_filters( "tmsblocks/block_classes/{$block_slug}", $all_classes, $attributes, $block );

    // -- Build attribute string -----------------------------------------------

    $attrs = '';
    if ( ! empty( $anchor_id ) )   { $attrs .= ' id="'         . esc_attr( $anchor_id )                  . '"'; }
    if ( ! empty( $all_classes ) ) { $attrs .= ' class="'      . esc_attr( implode( ' ', $all_classes ) ) . '"'; }
    if ( ! empty( $aria_label ) )  { $attrs .= ' aria-label="' . esc_attr( $aria_label )                  . '"'; }
    if ( ! empty( $aria_role ) )   { $attrs .= ' role="'       . esc_attr( $aria_role )                   . '"'; }
    if ( ! empty( $extra_attrs ) ) { $attrs .= $extra_attrs; }

    $attrs = apply_filters( "tmsblocks/block_attrs/{$block_slug}", $attrs, $attributes, $block );

    // -- Inline styles --------------------------------------------------------

    $handle  = tmsblocks_get_styles_handle();
    $all_css = '';

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
        $attributes['customBreakpoints']   ?? []
    );
    if ( $responsive_css ) {
        $all_css .= $responsive_css;
    }

    if ( $all_css ) {
        tmsblocks_add_inline_style_once( $handle, $all_css );
    }

    // -- Output ---------------------------------------------------------------

    $output = "<{$tag}{$attrs}>{$content}</{$tag}>";

    /**
     * Filters the final HTML output for any TMS block.
     *
     * Wrapper attributes are escaped before this point. Callback authors are
     * responsible for returning safe HTML because nested block output is
     * preserved and not re-sanitized after this filter.
     *
     * @param string   $output      The complete HTML string.
     * @param array    $attributes  The block attributes.
     * @param WP_Block $block       The block instance.
     */
    $output = apply_filters( 'tmsblocks/block_output', $output, $attributes, $block );

    /**
     * Filters the final HTML output for a specific TMS block.
     *
     * Callback authors are responsible for returning safe HTML because nested
     * block output is preserved and not re-sanitized after this filter.
     *
     * @param string   $output      The complete HTML string.
     * @param array    $attributes  The block attributes.
     * @param WP_Block $block       The block instance.
     */
    $output = apply_filters( "tmsblocks/block_output/{$block_slug}", $output, $attributes, $block );

    // Wrapper attributes are escaped above; do not re-sanitize nested block HTML here.
    echo $output; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped