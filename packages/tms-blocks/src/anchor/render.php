<?php
/**
 * TMS Anchor Block render callback.
 * 
 * phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound
 * phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.InvalidPrefixPassed
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }


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

    $anchor_id       = trim( $attributes['anchorId'] ?? '' );
    $tmsblocks_class = trim( preg_replace( '/\s+/', ' ', $attributes['tmsClassName'] ?? '' ) );
    $aria_label      = trim( $attributes['ariaLabel'] ?? '' );
    $aria_role       = trim( $attributes['ariaRole']  ?? '' );

    // -- Anchor-specific ------------------------------------------------------

    $href_raw     = isset( $attributes['href'] )        ? trim( $attributes['href'] )        : '';
    $dynamic_path = isset( $attributes['dynamicPath'] ) ? trim( $attributes['dynamicPath'] ) : '';
    $is_dynamic   = ! empty( $attributes['isDynamic'] );

    $inner_text                = isset( $attributes['innerText'] ) ? trim( $attributes['innerText'] ) : '';
    $inner_text_dynamic_path   = isset( $attributes['innerTextDynamicPath'] ) ? trim( $attributes['innerTextDynamicPath'] ) : '';
    $is_inner_text_dynamic     = ! empty( $attributes['isInnerTextDynamic'] );

    $rel    = isset( $attributes['rel'] )             ? esc_attr( trim( $attributes['rel'] ) )             : '';
    $refpol = isset( $attributes['referrerPolicy'] )  ? esc_attr( trim( $attributes['referrerPolicy'] ) )  : '';
    $target = isset( $attributes['target'] )          ? esc_attr( trim( $attributes['target'] ) )          : '';

    $source_post_id = isset( $attributes['sourcePostId'] ) ? (int) $attributes['sourcePostId'] : 0;
    $post_id = $source_post_id > 0
        ? $source_post_id
        : ( isset( $block->context['tmsblocks/contextPostId'] ) && (int) $block->context['tmsblocks/contextPostId'] > 0
            ? (int) $block->context['tmsblocks/contextPostId']
            : ( isset( $block->context['postId'] ) ? (int) $block->context['postId'] : get_the_ID() ) );

    // -- Resolve href ---------------------------------------------------------

    if ( $is_dynamic ) {
        $href_values = tmsblocks_get_dynamic_field_display_values(
            [
                'path'             => $dynamic_path,
                'dateFormat'       => $attributes['dynamicDateFormat']       ?? '',
                'commentsNoText'   => $attributes['dynamicCommentsNoText']   ?? '',
                'commentsOneText'  => $attributes['dynamicCommentsOneText']  ?? '',
                'commentsManyText' => $attributes['dynamicCommentsManyText'] ?? '',
            ],
            $post_id
        );

        $resolved = '';
        if ( ! empty( $href_values ) ) {
            $first = reset( $href_values );
            if ( is_string( $first ) && $first !== '' ) {
                $resolved = $first;
            }
        }

        if ( $resolved === '' ) {
            if ( $dynamic_path === 'link:author_archive' ) {
                $author_id = (int) get_post_field( 'post_author', $post_id );
                if ( $author_id ) {
                    $resolved = get_author_posts_url( $author_id ) ?: '';
                }
            } elseif ( $dynamic_path === 'link:author_mailto' ) {
                $author_id = (int) get_post_field( 'post_author', $post_id );
                if ( $author_id ) {
                    $author_email = get_the_author_meta( 'user_email', $author_id );
                    if ( $author_email ) {
                        $resolved = 'mailto:' . $author_email;
                    }
                }
            } elseif ( $dynamic_path === 'link:term_archive' ) {
                $post_taxonomies = get_object_taxonomies( get_post_type( $post_id ) );
                if ( ! empty( $post_taxonomies ) ) {
                    foreach ( $post_taxonomies as $taxonomy ) {
                        $terms = get_the_terms( $post_id, $taxonomy );
                        if ( is_array( $terms ) && ! empty( $terms ) ) {
                            $term_link = get_term_link( $terms[0] );
                            if ( ! is_wp_error( $term_link ) ) {
                                $resolved = $term_link;
                                break;
                            }
                        }
                    }
                }
            }
        }

        $href = $resolved !== '' ? esc_url( $resolved ) : '#';

    } elseif ( $href_raw !== '' ) {
        $href = esc_url( $href_raw );
    } else {
        $href = '#';
    }

    // -- Resolve inner text ---------------------------------------------------

    if ( $is_inner_text_dynamic ) {
        $inner_text = '';

        if ( '' !== $inner_text_dynamic_path ) {
            $inner_text_values = tmsblocks_get_dynamic_field_display_values(
                [
                    'path'             => $inner_text_dynamic_path,
                    'dateFormat'       => $attributes['innerTextDynamicDateFormat']       ?? '',
                    'commentsNoText'   => $attributes['innerTextDynamicCommentsNoText']   ?? '',
                    'commentsOneText'  => $attributes['innerTextDynamicCommentsOneText']  ?? '',
                    'commentsManyText' => $attributes['innerTextDynamicCommentsManyText'] ?? '',
                ],
                $post_id
            );

            $resolved_inner_text_values = [];

            if ( is_array( $inner_text_values ) ) {
                foreach ( $inner_text_values as $value ) {
                    if ( is_scalar( $value ) ) {
                        $value = trim( (string) $value );
                        if ( '' !== $value ) {
                            $resolved_inner_text_values[] = $value;
                        }
                    }
                }
            }

            $inner_text = ! empty( $resolved_inner_text_values )
                ? implode( ', ', $resolved_inner_text_values )
                : '';
        }
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

    $attrs = ' href="' . $href . '"';
    if ( ! empty( $anchor_id ) )   { $attrs .= ' id="'         . esc_attr( $anchor_id )                  . '"'; }
    if ( ! empty( $all_classes ) ) { $attrs .= ' class="'      . esc_attr( implode( ' ', $all_classes ) ) . '"'; }
    if ( ! empty( $aria_label ) )  { $attrs .= ' aria-label="' . esc_attr( $aria_label )                  . '"'; }
    if ( ! empty( $aria_role ) )   { $attrs .= ' role="'       . esc_attr( $aria_role )                   . '"'; }
    if ( ! empty( $rel ) )         { $attrs .= ' rel="'        . $rel                                     . '"'; }
    if ( ! empty( $refpol ) )      { $attrs .= ' referrerpolicy="' . $refpol                              . '"'; }
    if ( ! empty( $target ) )      { $attrs .= ' target="'     . $target                                  . '"'; }
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

    // -- Content --------------------------------------------------------------

    $inner_blocks_content = '';

    if ( ! empty( $block->inner_blocks ) ) {
        foreach ( $block->inner_blocks as $inner_block ) {
            $inner_blocks_content .= $inner_block->render();
        }
    }

    $has_inner_text   = $inner_text !== '';
    $has_inner_blocks = trim( $inner_blocks_content ) !== '';
    $has_content      = $has_inner_text || $has_inner_blocks;
    $has_href         = $href !== '' && $href !== '#';
    $has_label        = $aria_label !== '';
    $has_anchor_id    = $anchor_id !== '';

    // Keep the visible label explicit; do not auto-fill it from the href.
    if ( ! $has_content && ! $has_label && ! $has_href && ! $has_anchor_id ) {
        return;
    }

    $inner_content = '';
    if ( ! empty( $inner_text ) ) {
        $inner_content .= '<span>' . wp_kses_post( $inner_text ) . '</span>';
    }
    $inner_content .= $inner_blocks_content;

    // -- Output ---------------------------------------------------------------

    $output = '<a' . $attrs . '>' . $inner_content . '</a>';

    /**
     * Filters the final HTML output for any TMS block.
     *
     * Wrapper attributes and owned RichText are sanitized before this point.
     * Callback authors are responsible for returning safe HTML because nested
     * block output is preserved and not re-sanitized after this filter.
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

    // Wrapper attributes and owned RichText are sanitized above; do not re-sanitize child block HTML here.
    echo $output; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped