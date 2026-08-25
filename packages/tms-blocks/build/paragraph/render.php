<?php
/**
 * Server-side render for the Paragraph block.
 * 
 * phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound
 * phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.InvalidPrefixPassed
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}


    // -- Early exit -----------------------------------------------------------

    if ( array_key_exists( 'renderBlock', $attributes ) && false === $attributes['renderBlock'] ) {
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
    $tag_name        = isset( $attributes['tagName'] ) ? sanitize_key( $attributes['tagName'] ) : 'p';
    $tag_name        = in_array( $tag_name, array( 'p', 'figcaption' ), true ) ? $tag_name : 'p';

    // -- Paragraph content ----------------------------------------------------

    $allowed_tags = tmsblocks_get_phrasing_allowed_tags();
    $is_dynamic   = ! empty( $attributes['isDynamic'] );

    if ( $is_dynamic ) {
        $source_post_id = isset( $attributes['sourcePostId'] ) ? (int) $attributes['sourcePostId'] : 0;
        $post_id = $source_post_id > 0
            ? $source_post_id
            : ( isset( $block->context['tmsblocks/contextPostId'] ) && (int) $block->context['tmsblocks/contextPostId'] > 0
                ? (int) $block->context['tmsblocks/contextPostId']
                : ( isset( $block->context['postId'] ) ? (int) $block->context['postId'] : get_the_ID() ) );

        $dynamic_path = trim( $attributes['dynamicPath'] ?? '' );
        $empty_text   = $attributes['emptyText']  ?? '';
        $separator    = $attributes['separator']   ?? ', ';

        if ( $dynamic_path === '' ) {
            $paragraph_content = $empty_text ? wp_kses( $empty_text, $allowed_tags ) : '';
        } else {
            $display_values = tmsblocks_get_dynamic_field_display_values(
                array(
                    'path'             => $dynamic_path,
                    'dateFormat'       => $attributes['dynamicDateFormat']       ?? '',
                    'commentsNoText'   => $attributes['dynamicCommentsNoText']   ?? '',
                    'commentsOneText'  => $attributes['dynamicCommentsOneText']  ?? '',
                    'commentsManyText' => $attributes['dynamicCommentsManyText'] ?? '',
                ),
                $post_id
            );

            if ( empty( $display_values ) ) {
                $paragraph_content = $empty_text ? wp_kses( $empty_text, $allowed_tags ) : '';
            } else {
                $paragraph_content = implode(
                    esc_html( $separator ),
                    array_map( function( $v ) use ( $allowed_tags ) {
                        return wp_kses( (string) $v, $allowed_tags );
                    }, $display_values )
                );
            }
        }
    } else {
        $paragraph_content = $attributes['content'] ?? '';
        $tag_pattern       = preg_quote( $tag_name, '/' );

        if ( '' === $paragraph_content && isset( $content ) && preg_match( '/<' . $tag_pattern . '[^>]*>(.*?)<\/' . $tag_pattern . '>/is', $content, $matches ) ) {
            $paragraph_content = $matches[1];
        }
        if ( '' === $paragraph_content && ! empty( $content ) ) {
            $paragraph_content = (string) $content;
        }

        $block_content_tags = tmsblocks_get_block_content_allowed_tags();
        $paragraph_content  = wp_kses( $paragraph_content, $block_content_tags );
    }

    // -- Truncation -----------------------------------------------------------

    if ( ! empty( $attributes['truncateEnabled'] ) && $paragraph_content !== '' ) {
        /**
         * Filters the truncation options for a paragraph block before truncating.
         *
         * Useful for modifying the suffix (or length/unit) based on custom logic,
         * e.g. an ACF boolean field on the post:
         *
         *   add_filter( 'tmsblocks/paragraph_truncate_options', function( $options, $content, $attributes, $block ) {
         *       $post_id = $block->context['postId'] ?? get_the_ID();
         *       if ( ! get_field( 'append_ellipsis_to_excerpt', $post_id ) ) {
         *           $options['suffix'] = '';
         *       }
         *       return $options;
         *   }, 10, 4 );
         *
         * @param array    $options    Truncation options: 'length', 'unit', 'suffix'.
         * @param string   $content    The paragraph content before truncation.
         * @param array    $attributes The block attributes.
         * @param WP_Block $block      The block instance.
         */
        $truncate_options = apply_filters(
            'tmsblocks/paragraph_truncate_options',
            array(
                'length' => isset( $attributes['truncateLength'] ) ? (int)    $attributes['truncateLength'] : 200,
                'unit'   => isset( $attributes['truncateUnit'] )   ? (string) $attributes['truncateUnit']   : 'characters',
                'suffix' => isset( $attributes['truncateSuffix'] ) ? (string) $attributes['truncateSuffix'] : '...',
            ),
            $paragraph_content,
            $attributes,
            $block
        );

        $paragraph_content = tmsblocks_truncate( $paragraph_content, $truncate_options );
    }

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

    $custom_selectors_css = tmsblocks_process_custom_selectors(
        $attributes['customSelectors'] ?? [],
        $unique_class_name,
        $attributes['breakpointOverrides'] ?? [],
        $attributes['customBreakpoints'] ?? []
    );
    if ( $custom_selectors_css ) {
        tmsblocks_add_inline_style_once( $handle, $custom_selectors_css );
    }

    // -- Output ---------------------------------------------------------------

    $output = "<{$tag_name}{$attrs}>" . $paragraph_content . "</{$tag_name}>";

    $output = apply_filters( 'tmsblocks/block_output',               $output, $attributes, $block );
    $output = apply_filters( "tmsblocks/block_output/{$block_slug}", $output, $attributes, $block );

    echo wp_kses( $output, tmsblocks_get_block_output_allowed_tags() );
    