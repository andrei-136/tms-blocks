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
    $unique_class_name = ! empty( $unique_id )
        ? sanitize_html_class( "tmsblocks-post-context-{$unique_id}" )
        : '';
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

    $custom_selectors_css = tmsblocks_process_custom_selectors(
        $attributes['customSelectors'] ?? [],
        $unique_class_name,
        $attributes['breakpointOverrides'] ?? [],
        $attributes['customBreakpoints'] ?? []
    );
    if ( $custom_selectors_css ) {
        tmsblocks_add_inline_style_once( $handle, $custom_selectors_css );
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

    // -- Build attributes map -------------------------------------------------

    $attrs_map = [];
    if ( ! empty( $anchor_id ) )   { $attrs_map['id'] = $anchor_id; }
    if ( ! empty( $all_classes ) ) { $attrs_map['class'] = implode( ' ', $all_classes ); }
    if ( ! empty( $aria_label ) )  { $attrs_map['aria-label'] = $aria_label; }
    if ( ! empty( $aria_role ) )   { $attrs_map['role'] = $aria_role; }

    $attrs_map = apply_filters( 'tmsblocks/block_attrs/post-context', $attrs_map, $attributes, $block );
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
    if ( ! empty( $extra_attrs ) ) { $attrs .= $extra_attrs; }

    // -- Output ---------------------------------------------------------------

    // Security boundary: the wrapper tag is hardened with tag_escape(); every attribute
    // value is individually escaped with esc_attr() before being concatenated into
    // $attrs. $content is the WordPress-core-rendered inner block HTML — applying
    // wp_kses() here would strip legitimate nested markup, so it is intentionally left
    // unsanitized.  
    // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
    $tag = tag_escape( $tag );
    echo "<{$tag}{$attrs}>{$content}</{$tag}>";