<?php
/**
 * Server-side render for the List Item block.
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

    // -- Build attributes map -------------------------------------------------

    $attrs_map = [];
    if ( ! empty( $anchor_id ) )   { $attrs_map['id'] = $anchor_id; }
    if ( ! empty( $all_classes ) ) { $attrs_map['class'] = implode( ' ', $all_classes ); }
    if ( ! empty( $aria_label ) )  { $attrs_map['aria-label'] = $aria_label; }
    if ( ! empty( $aria_role ) )   { $attrs_map['role'] = $aria_role; }

    $attrs_map = apply_filters( "tmsblocks/block_attrs/{$block_slug}", $attrs_map, $attributes, $block );
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
    $custom_selectors_css = tmsblocks_process_custom_selectors(
        $attributes['customSelectors'] ?? [],
        $unique_class_name,
        $attributes['breakpointOverrides'] ?? [],
        $attributes['customBreakpoints'] ?? []
    );
    if ( $custom_selectors_css ) {
        tmsblocks_add_inline_style_once( $handle, $custom_selectors_css );
    }
    // -- Content --------------------------------------------------------------

    $rich_text_content = isset( $attributes['content'] ) ? trim( (string) $attributes['content'] ) : '';
    $item_content      = $content;

    if ( ! empty( $rich_text_content ) ) {
        $item_content = wp_kses_post( $rich_text_content ) . $item_content;
    }

    // -- Output ---------------------------------------------------------------

    // Security boundary: every attribute value is individually escaped with esc_attr()
    // before being concatenated into $attrs. The owned RichText ($rich_text_content)
    // is sanitized with wp_kses_post() above. $content is the WordPress-core-rendered
    // inner block HTML — applying wp_kses() here would strip legitimate nested markup,
    // so it is intentionally left unsanitized. 
    // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
    echo '<li' . $attrs . '>' . $item_content . '</li>';