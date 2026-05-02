<?php
/**
 * Server-side render for the Dynamic Field block.
 * 
 * phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound
 * phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.InvalidPrefixPassed
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}


    // -- Early exit -----------------------------------------------------------

    if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
        return;
    }

    if ( isset( $attributes['renderBlock'] ) && ! $attributes['renderBlock'] ) {
        return;
    }

    $post_source = isset( $attributes['postSource'] ) ? (string) $attributes['postSource'] : 'current';
    $source_post_id = isset( $attributes['sourcePostId'] ) ? (int) $attributes['sourcePostId'] : 0;

    $context_post_id = 0;
    if ( isset( $block->context['tmsblocks/contextPostId'] ) ) {
        $context_post_id = (int) $block->context['tmsblocks/contextPostId'];
    } elseif ( isset( $block->context['tms/contextPostId'] ) ) {
        $context_post_id = (int) $block->context['tms/contextPostId'];
    }

    $post_id = ( $post_source === 'specific' )
        ? $source_post_id
        : ( $context_post_id > 0
            ? $context_post_id
            : ( isset( $block->context['postId'] ) ? (int) $block->context['postId'] : (int) get_the_ID() )
        );

    if ( $post_id <= 0 ) {
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

    $tag        = tag_escape( $attributes['tagName'] ?? 'div' );
    $anchor_id  = trim( $attributes['anchorId']   ?? '' );
    $tmsblocks_class  = trim( preg_replace( '/\s+/', ' ', $attributes['tmsClassName'] ?? '' ) );
    $class_name = trim( preg_replace( '/\s+/', ' ', $attributes['className']    ?? '' ) );
    $aria_label = trim( $attributes['ariaLabel']  ?? '' );
    $aria_role  = trim( $attributes['ariaRole']   ?? '' );

    // -- Dynamic field-specific -----------------------------------------------

    $steps_to_path = static function( $steps ) {
        if ( ! is_array( $steps ) || empty( $steps ) ) {
            return '';
        }

        $parts = array();
        foreach ( $steps as $step ) {
            if ( ! is_array( $step ) ) {
                continue;
            }

            $type  = isset( $step['type'] ) ? trim( (string) $step['type'] ) : '';
            $value = isset( $step['value'] ) ? trim( (string) $step['value'] ) : '';

            if ( '' === $type ) {
                continue;
            }

            if ( in_array( $type, array( 'parent', 'author', 'comments' ), true ) ) {
                $parts[] = $type;
                continue;
            }

            if ( '' !== $value ) {
                $parts[] = $type . ':' . $value;
            }
        }

        return implode( '.', $parts );
    };

    $path       = trim( $attributes['path'] ?? '' );
    if ( '' === $path ) {
        $path = $steps_to_path( $attributes['steps'] ?? array() );
    }
    $separator  = isset( $attributes['separator'] ) ? (string) $attributes['separator'] : ', ';
    $empty_text = $attributes['emptyText']  ?? '';

    if ( $path === '' ) {
        if ( $empty_text ) {
            $output = '<' . $tag . '>' . esc_html( $empty_text ) . '</' . $tag . '>';
            echo wp_kses( $output, tmsblocks_get_block_output_allowed_tags() );
        }
        return;
    }

    // -- Custom styles --------------------------------------------------------

    $custom_style                 = tmsblocks_process_custom_styles( $attributes['customStyle']             ?? [] );
    $item_style_raw               = tmsblocks_process_custom_styles( $attributes['itemStyle']               ?? [] );
    $item_style_hover_raw         = tmsblocks_process_custom_styles( $attributes['itemStyleHover']          ?? [] );
    $item_style_focus_visible_raw = tmsblocks_process_custom_styles( $attributes['itemStyleFocusVisible']   ?? [] );
    $item_class                   = trim( $attributes['itemClassName'] ?? '' );
    $item_style_inline_fallback   = $unique_class_name ? '' : $item_style_raw;

    // -- Inline styles --------------------------------------------------------

    $handle  = tmsblocks_get_styles_handle();
    $all_css = '';

    if ( $unique_class_name ) {
        if ( $custom_style )               { $all_css .= "body .{$unique_class_name} { {$custom_style} }\n"; }

        // Item styles (target both <a> elements and the data attribute for non-link items)
        $item_sel = "body .{$unique_class_name} [data-tmsblocks-dynamic-field-item]";

        if ( $item_style_raw )               { $all_css .= "{$item_sel} { {$item_style_raw} }\n"; }
        if ( $item_style_hover_raw )         { $all_css .= "body .{$unique_class_name} a:hover, {$item_sel}:hover { {$item_style_hover_raw} }\n"; }
        if ( $item_style_focus_visible_raw ) { $all_css .= "body .{$unique_class_name} a:focus-visible, {$item_sel}:focus-visible { {$item_style_focus_visible_raw} }\n"; }
    }

    // Container responsive styles
    $responsive_css = tmsblocks_process_responsive_styles(
        $attributes['responsiveStyle']     ?? [],
        $unique_class_name,
        $attributes['breakpointOverrides'] ?? [],
        $attributes['customBreakpoints']   ?? []
    );
    if ( $responsive_css ) {
        $all_css .= $responsive_css;
    }

    // Item responsive styles - selector overrides for each breakpoint
    if ( $unique_class_name ) {
        $item_responsive = $attributes['itemResponsiveStyle'] ?? [];
        $overrides       = $attributes['breakpointOverrides'] ?? [];
        $custom_bps      = $attributes['customBreakpoints']   ?? [];

        if ( is_array( $item_responsive ) && ! empty( $item_responsive ) ) {
            $breakpoints = tmsblocks_get_breakpoints();

            // Merge in custom breakpoints
            if ( is_array( $custom_bps ) ) {
                foreach ( $custom_bps as $cbp ) {
                    if ( ! empty( $cbp['key'] ) && isset( $cbp['maxWidth'] ) ) {
                        $breakpoints[] = [ 'key' => $cbp['key'], 'maxWidth' => (int) $cbp['maxWidth'] ];
                    }
                }
            }

            // Apply overrides
            foreach ( $breakpoints as &$bp ) {
                if ( isset( $overrides[ $bp['key'] ] ) ) {
                    $bp['maxWidth'] = (int) $overrides[ $bp['key'] ];
                }
            }
            unset( $bp );

            // Sort largest to smallest
            usort( $breakpoints, fn( $a, $b ) => $b['maxWidth'] <=> $a['maxWidth'] );

            $item_sel = ".{$unique_class_name} [data-tmsblocks-dynamic-field-item]";
        $item_sel = "body .{$unique_class_name} [data-tmsblocks-dynamic-field-item]";

            foreach ( $breakpoints as $bp ) {
                $key      = $bp['key'];
                $max_width = (int) $bp['maxWidth'];

                if ( empty( $item_responsive[ $key ] ) || ! is_array( $item_responsive[ $key ] ) ) {
                    continue;
                }

                $base  = tmsblocks_process_custom_styles( $item_responsive[ $key ]['base']         ?? [] );
                $hover = tmsblocks_process_custom_styles( $item_responsive[ $key ]['hover']        ?? [] );
                $focus = tmsblocks_process_custom_styles( $item_responsive[ $key ]['focusVisible'] ?? [] );

                if ( $base )  { $all_css .= "@media (max-width: {$max_width}px) { {$item_sel} { {$base} } }\n"; }
                if ( $hover ) { $all_css .= "@media (max-width: {$max_width}px) { body .{$unique_class_name} a:hover, {$item_sel}:hover { {$hover} } }\n"; }
                if ( $focus ) { $all_css .= "@media (max-width: {$max_width}px) { body .{$unique_class_name} a:focus-visible, {$item_sel}:focus-visible { {$focus} } }\n"; }
            }
        }
    }

    if ( $all_css ) {
        tmsblocks_add_inline_style_once( $handle, $all_css );
    }

    // -- Custom attributes ----------------------------------------------------

    $extra_attrs = '';

    $custom_attrs_raw = $attributes['customAttributes'] ?? [];
    if ( is_array( $custom_attrs_raw ) ) {
        foreach ( $custom_attrs_raw as $attr ) {
            $key = isset( $attr['key'] ) ? trim( $attr['key'] ) : '';
            $val = isset( $attr['value'] ) ? $attr['value'] : '';
            if ( empty( $key ) ) continue;
            if ( $key === 'download' ) {
                $extra_attrs .= empty( $val ) || $val === 'true' ? ' download' : ' download="' . esc_attr( $val ) . '"';
                continue;
            }
            if ( preg_match( '/^data-[a-z0-9-]+$/', $key ) || in_array( $key, [ 'tabindex', 'title' ], true ) ) {
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

    $all_classes = array_filter( [ $class_name, $block_class_name, $tmsblocks_class, $unique_class_name ] );
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

    // -- Resolve values -------------------------------------------------------

    $display_values = tmsblocks_get_dynamic_field_display_values( $attributes, $post_id );

    if ( empty( $display_values ) ) {
        $inner = $empty_text ? esc_html( $empty_text ) : '';
    } else {
        $item_type        = $attributes['itemType']     ?? 'text';
        $href_source      = $attributes['hrefSource']   ?? 'field';
        $static_href      = trim( $attributes['staticHref']     ?? '' );
        $href_path        = trim( $attributes['hrefPath']        ?? '' );
        if ( '' === $href_path ) {
            $href_path = $steps_to_path( $attributes['hrefSteps'] ?? array() );
        }
        $link_label_mode  = $attributes['linkLabelMode']         ?? 'dynamic';
        $link_text_static = trim( $attributes['linkText']        ?? '' );
        $link_text_path   = trim( $attributes['linkTextPath']    ?? '' );
        if ( '' === $link_text_path ) {
            $link_text_path = $steps_to_path( $attributes['linkTextSteps'] ?? array() );
        }

        // Separate href values when hrefSource === 'path'
        $href_values = [];
        if ( $item_type === 'url' && $href_source === 'path' && $href_path !== '' ) {
            $href_values = array_values( tmsblocks_get_dynamic_field_display_values(
                [ 'path' => $href_path ],
                $post_id
            ) );
        }

        // Label values when linkLabelMode === 'dynamic'
        $link_text_values = [];
        if ( $item_type === 'url' && $href_source !== 'path' && $link_label_mode === 'dynamic' && $link_text_path !== '' ) {
            $link_text_values = array_values( tmsblocks_get_dynamic_field_display_values(
                [ 'path' => $link_text_path ],
                $post_id
            ) );
        }

        $output_parts = [];
        foreach ( array_values( $display_values ) as $index => $value ) {

            // Resolve href
            if ( $item_type === 'url' ) {
                if ( $href_source === 'static' ) {
                    $resolved_href = $static_href !== '' ? $static_href : '#';
                } elseif ( $href_source === 'path' ) {
                    $resolved_href = ! empty( $href_values[ $index ] ) ? $href_values[ $index ] : '#';
                } else {
                    $resolved_href = $value;
                }
            } else {
                $resolved_href = $value;
            }

            // Resolve label
            if ( $item_type === 'url' ) {
                if ( $href_source === 'path' ) {
                    $resolved_link_text = $value;
                } elseif ( $link_label_mode === 'static' ) {
                    $resolved_link_text = $link_text_static !== '' ? $link_text_static : $value;
                } else {
                    $resolved_link_text = ! empty( $link_text_values[ $index ] )
                        ? $link_text_values[ $index ]
                        : ( $link_text_static !== '' ? $link_text_static : $value );
                }
            } else {
                $resolved_link_text = $value;
            }

            $output_parts[] = tmsblocks_render_dynamic_field_item(
                $value,
                $resolved_href,
                $resolved_link_text,
                $attributes,
                $item_style_inline_fallback,
                $item_class
            );
        }

        if ( '' === $separator ) {
            $inner = implode( '', $output_parts );
        } else {
            $wrapped_separator = '<span class="tmsblocks-dynamic-field-separator">' . esc_html( $separator ) . '</span>';
            $inner = implode( $wrapped_separator, $output_parts );
        }
    }

    // -- Output ---------------------------------------------------------------

    $output = "<{$tag}{$attrs}>" . wp_kses_post( $inner ) . "</{$tag}>";

    $output = apply_filters( 'tmsblocks/block_output',               $output, $attributes, $block );
    $output = apply_filters( "tmsblocks/block_output/{$block_slug}", $output, $attributes, $block );

    echo wp_kses( $output, tmsblocks_get_block_output_allowed_tags() );