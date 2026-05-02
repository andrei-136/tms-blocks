<?php
/**
 * Server-side render for the Post Context block.
 *
 * Provides tmsblocks/contextPostId and tmsblocks/contextPostType context to child blocks.
 * Renders a wrapper element with style support around inner block content.
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

    $scope_post_id = isset( $attributes['contextPostId'] ) ? (int) $attributes['contextPostId'] : 0;

    if ( ! $scope_post_id ) {
        return;
    }

    $post = get_post( $scope_post_id );
    if ( ! $post ) {
        return;
    }

    // -- Block identity -------------------------------------------------------

    $tag               = tag_escape( ! empty( $attributes['tagName'] ) ? $attributes['tagName'] : 'div' );
    $unique_id         = $attributes['uniqueId'] ?? '';
    $unique_class_name = ! empty( $unique_id ) ? "tmsblocks-post-context-{$unique_id}" : '';
    $tmsblocks_class   = trim( preg_replace( '/\s+/', ' ', $attributes['tmsClassName'] ?? '' ) );
    $anchor_id         = trim( $attributes['anchorId']  ?? '' );
    $aria_label        = trim( $attributes['ariaLabel'] ?? '' );
    $aria_role         = trim( $attributes['ariaRole']  ?? '' );

    // -- Custom styles --------------------------------------------------------

    $custom_style               = tmsblocks_process_custom_styles( $attributes['customStyle']             ?? [] );
    $custom_style_hover         = tmsblocks_process_custom_styles( $attributes['customStyleHover']        ?? [] );
    $custom_style_focus_visible = tmsblocks_process_custom_styles( $attributes['customStyleFocusVisible'] ?? [] );

    $handle  = tmsblocks_get_styles_handle();
    $all_css = '';

    if ( $unique_class_name ) {
        if ( $custom_style )               { $all_css .= "body .{$unique_class_name} { {$custom_style} }\n"; }
        if ( $custom_style_hover )         { $all_css .= "@media (hover: hover) and (pointer: fine) { body .{$unique_class_name}:hover { {$custom_style_hover} } }\n"; }
        if ( $custom_style_focus_visible ) { $all_css .= "body .{$unique_class_name}:focus-visible { {$custom_style_focus_visible} }\n"; }
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

    // -- Class list -----------------------------------------------------------

    $all_classes = array_filter( [ 'tmsblocks-post-context', $tmsblocks_class, $unique_class_name ] );
    $all_classes = apply_filters( 'tmsblocks/block_classes',              $all_classes, $attributes, $block );
    $all_classes = apply_filters( 'tmsblocks/block_classes/post-context', $all_classes, $attributes, $block );

    // -- Custom attributes ----------------------------------------------------

    $extra_attrs = '';

    $custom_attrs_raw = $attributes['customAttributes'] ?? [];
    if ( is_array( $custom_attrs_raw ) ) {
        foreach ( $custom_attrs_raw as $ca ) {
            $ca_key = isset( $ca['key'] )   ? trim( (string) $ca['key'] )   : '';
            $ca_val = isset( $ca['value'] ) ? trim( (string) $ca['value'] ) : '';
            if ( ! $ca_key ) continue;
            if ( $ca_key === 'download' ) {
                $extra_attrs .= empty( $ca_val ) || $ca_val === 'true' ? ' download' : ' download="' . esc_attr( $ca_val ) . '"';
                continue;
            }
            if ( preg_match( '/^data-[a-z0-9-]+$/', $ca_key ) || in_array( $ca_key, [ 'tabindex', 'title' ], true ) ) {
                $extra_attrs .= ' ' . esc_attr( $ca_key ) . '="' . esc_attr( $ca_val ) . '"';
            }
        }
    }

    $extra_aria_raw = $attributes['extraAriaAttributes'] ?? [];
    if ( is_array( $extra_aria_raw ) ) {
        foreach ( $extra_aria_raw as $aria_attr ) {
            $aria_key = isset( $aria_attr['key'] )   ? trim( $aria_attr['key'] )   : '';
            $aria_val = isset( $aria_attr['value'] ) ? trim( $aria_attr['value'] ) : '';
            if ( ! $aria_key || ! $aria_val ) continue;
            if ( ! preg_match( '/^aria-[a-z-]+$/', $aria_key ) ) continue;
            $extra_attrs .= ' ' . esc_attr( $aria_key ) . '="' . esc_attr( $aria_val ) . '"';
        }
    }

    // -- Build attribute string -----------------------------------------------

    $attrs = '';
    if ( ! empty( $anchor_id ) )   { $attrs .= ' id="'         . esc_attr( $anchor_id )                  . '"'; }
    if ( ! empty( $all_classes ) ) { $attrs .= ' class="'      . esc_attr( implode( ' ', $all_classes ) ) . '"'; }
    if ( ! empty( $aria_label ) )  { $attrs .= ' aria-label="' . esc_attr( $aria_label )                  . '"'; }
    if ( ! empty( $aria_role ) )   { $attrs .= ' role="'       . esc_attr( $aria_role )                   . '"'; }
    if ( ! empty( $extra_attrs ) ) { $attrs .= $extra_attrs; }

    $attrs = apply_filters( 'tmsblocks/block_attrs/post-context', $attrs, $attributes, $block );

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
     * Filters the final HTML output for the Post Context block.
     *
     * Callback authors are responsible for returning safe HTML because nested
     * block output is preserved and not re-sanitized after this filter.
     *
     * @param string   $output      The complete HTML string.
     * @param array    $attributes  The block attributes.
     * @param WP_Block $block       The block instance.
     */
    $output = apply_filters( 'tmsblocks/block_output/post-context', $output, $attributes, $block );

    // Wrapper attributes are escaped above; do not re-sanitize nested block HTML here.
    echo $output; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped