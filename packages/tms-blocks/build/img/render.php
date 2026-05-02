<?php
/**
 * Server-side render for the Image block.
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

    $unique_id         = $attributes['uniqueId'] ?? '';
    $unique_class_name = ! empty( $unique_id ) ? "tmsblocks-img-{$unique_id}" : '';
    $tmsblocks_class   = trim( preg_replace( '/\s+/', ' ', $attributes['tmsClassName'] ?? '' ) );

    // -- Resolve post ID ------------------------------------------------------

    $source_post_id = isset( $attributes['sourcePostId'] ) ? (int) $attributes['sourcePostId'] : 0;
    $post_id = $source_post_id > 0
        ? $source_post_id
        : ( isset( $block->context['tmsblocks/contextPostId'] ) && (int) $block->context['tmsblocks/contextPostId'] > 0
            ? (int) $block->context['tmsblocks/contextPostId']
            : ( isset( $block->context['postId'] ) ? (int) $block->context['postId'] : get_the_ID() ) );

    // -- Image source ---------------------------------------------------------

    $image_source = isset( $attributes['imageSource'] ) ? sanitize_key( $attributes['imageSource'] ) : 'library';
    $image_id     = isset( $attributes['imageID'] )     ? (int) $attributes['imageID']               : 0;
    $image_url    = isset( $attributes['imageURL'] )    ? esc_url_raw( (string) $attributes['imageURL'] ) : '';
    $image_path   = isset( $attributes['imagePath'] )   ? trim( (string) $attributes['imagePath'] )   : '';
    $image_size   = isset( $attributes['imageSize'] )   ? sanitize_key( $attributes['imageSize'] )    : 'full';

    switch ( $image_source ) {
        case 'dynamic':
            $image_id  = 0;
            $image_url = '';
            if ( $image_path !== '' ) {
                $values = tmsblocks_get_dynamic_field_display_values( array( 'path' => $image_path ), $post_id );
                if ( ! empty( $values ) ) {
                    $first = reset( $values );
                    if ( is_numeric( $first ) ) {
                        $image_id = (int) $first;
                    } elseif ( is_string( $first ) ) {
                        $image_url = esc_url( $first );
                    }
                }
            }
            break;

        case 'context':
            if ( $post_id && get_post_type( $post_id ) === 'attachment' ) {
                $image_id = $post_id;
            } else {
                $image_id = $post_id ? (int) get_post_thumbnail_id( $post_id ) : 0;
            }
            $image_url = '';
            break;

        case 'url':
            $image_id = 0;
            break;

        default: // 'library'
            $image_url = '';
            break;
    }

    // Normalize dynamic source to attachment ID when possible
    if ( $image_source === 'dynamic' ) {
        if ( $image_id > 0 ) {
            if ( get_post_type( $image_id ) !== 'attachment' ) {
                $thumb_id = (int) get_post_thumbnail_id( $image_id );
                if ( $thumb_id > 0 ) { $image_id = $thumb_id; $image_url = ''; }
            }
        } elseif ( ! empty( $image_url ) ) {
            $resolved_attachment_id = (int) attachment_url_to_postid( $image_url );
            if ( $resolved_attachment_id > 0 ) { $image_id = $resolved_attachment_id; $image_url = ''; }
        }
    }

    if ( ! $image_id && empty( $image_url ) ) {
        if ( ! empty( $content ) && preg_match( '/<img\b[^>]*>/i', (string) $content, $matches ) ) {
            echo wp_kses( $matches[0], tmsblocks_get_block_output_allowed_tags() );
            return;
        }
        return;
    }

    // -- Alt text -------------------------------------------------------------

    $alt_source = isset( $attributes['altSource'] ) ? sanitize_key( $attributes['altSource'] ) : 'media-library';
    $alt_path   = isset( $attributes['altPath'] )   ? trim( (string) $attributes['altPath'] )  : '';
    $stored_alt = isset( $attributes['alt'] )       ? (string) $attributes['alt']              : '';

    $is_library_like = in_array( $image_source, array( 'library', 'context' ), true );

    if ( $is_library_like ) {
        if ( $alt_source === 'manual-library' ) {
            $effective_alt_source = 'manual';
        } elseif ( $alt_source === 'dynamic' ) {
            $effective_alt_source = 'dynamic';
        } else {
            $effective_alt_source = 'media-library';
        }
    } else {
        $effective_alt_source = ( $alt_source === 'dynamic' ) ? 'dynamic' : 'manual';
    }

    if ( $effective_alt_source === 'dynamic' && $alt_path !== '' ) {
        $alt_values   = tmsblocks_get_dynamic_field_display_values( array( 'path' => $alt_path ), $post_id );
        $resolved_alt = ! empty( $alt_values ) ? wp_strip_all_tags( (string) reset( $alt_values ) ) : '';
    } else {
        $resolved_alt = wp_strip_all_tags( $stored_alt );
    }

    // -- Performance attributes -----------------------------------------------

    $loading       = isset( $attributes['loading'] )       ? sanitize_key( $attributes['loading'] )       : 'lazy';
    $decoding      = isset( $attributes['decoding'] )      ? sanitize_key( $attributes['decoding'] )      : 'auto';
    $fetchpriority = isset( $attributes['fetchpriority'] ) ? sanitize_key( $attributes['fetchpriority'] ) : '';

    // -- Styles ---------------------------------------------------------------

    $custom_style               = tmsblocks_process_custom_styles( $attributes['customStyle']             ?? array() );
    $custom_style_hover         = tmsblocks_process_custom_styles( $attributes['customStyleHover']        ?? array() );
    $custom_style_focus_visible = tmsblocks_process_custom_styles( $attributes['customStyleFocusVisible'] ?? array() );

    $handle  = tmsblocks_get_styles_handle();
    $all_css = '';

    if ( $unique_class_name ) {
        if ( $custom_style )               { $all_css .= "body .{$unique_class_name} { {$custom_style} }\n"; }
        if ( $custom_style_hover )         { $all_css .= "body .{$unique_class_name}:hover { {$custom_style_hover} }\n"; }
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

    $all_classes = array_filter( array( 'tmsblocks-img', $tmsblocks_class, $unique_class_name ) );
    $all_classes = apply_filters( 'tmsblocks/block_classes',     $all_classes, $attributes, $block );
    $all_classes = apply_filters( 'tmsblocks/block_classes/img', $all_classes, $attributes, $block );

    // -- Attribute string -----------------------------------------------------

    $anchor_id  = trim( $attributes['anchorId']  ?? '' );
    $aria_label = trim( $attributes['ariaLabel'] ?? '' );

    $attrs = '';
    if ( ! empty( $anchor_id ) )   { $attrs .= ' id="'         . esc_attr( $anchor_id )                  . '"'; }
    if ( ! empty( $all_classes ) ) { $attrs .= ' class="'      . esc_attr( implode( ' ', $all_classes ) ) . '"'; }
    if ( ! empty( $aria_label ) )  { $attrs .= ' aria-label="' . esc_attr( $aria_label )                  . '"'; }

    // Extra aria-* attributes
    $extra_aria_raw = $attributes['extraAriaAttributes'] ?? [];
    if ( is_array( $extra_aria_raw ) ) {
        foreach ( $extra_aria_raw as $aria_attr ) {
            $aria_key = isset( $aria_attr['key'] )   ? trim( $aria_attr['key'] )   : '';
            $aria_val = isset( $aria_attr['value'] ) ? trim( $aria_attr['value'] ) : '';
            if ( ! $aria_key || ! $aria_val ) continue;
            if ( ! preg_match( '/^aria-[a-z-]+$/', $aria_key ) ) continue;
            $attrs .= ' ' . esc_attr( $aria_key ) . '="' . esc_attr( $aria_val ) . '"';
        }
    }

    // Custom attributes (img-safe keys only)
    $custom_attrs_raw = $attributes['customAttributes'] ?? [];
    if ( is_array( $custom_attrs_raw ) ) {
        foreach ( $custom_attrs_raw as $ca ) {
            $ca_key = isset( $ca['key'] )   ? trim( (string) $ca['key'] )   : '';
            $ca_val = isset( $ca['value'] ) ? trim( (string) $ca['value'] ) : '';
            if ( ! $ca_key ) continue;
            if (
                $ca_key === 'crossorigin' ||
                preg_match( '/^data-[a-z0-9-]+$/', $ca_key )
            ) {
                $attrs .= ' ' . esc_attr( $ca_key ) . '="' . esc_attr( $ca_val ) . '"';
            }
        }
    }

    // Inline style fallback (no unique class)
    if ( ! $unique_class_name && $custom_style ) {
        $attrs .= ' style="' . esc_attr( $custom_style ) . '"';
    }

    // Performance
    $attrs .= ' loading="'  . esc_attr( $loading )  . '"';
    $attrs .= ' decoding="' . esc_attr( $decoding ) . '"';
    if ( $fetchpriority ) {
        $attrs .= ' fetchpriority="' . esc_attr( $fetchpriority ) . '"';
    }

    $attrs = apply_filters( 'tmsblocks/block_attrs/img', $attrs, $attributes, $block );

    // -- Render ---------------------------------------------------------------

    $override_alt = $effective_alt_source !== 'media-library';

    if ( $image_id ) {
        $wp_attrs = array();
        if ( ! empty( $anchor_id ) )   $wp_attrs['id']           = $anchor_id;
        if ( ! empty( $all_classes ) ) $wp_attrs['class']        = implode( ' ', $all_classes );
        if ( ! empty( $aria_label ) )  $wp_attrs['aria-label']   = $aria_label;
        if ( $fetchpriority )          $wp_attrs['fetchpriority'] = $fetchpriority;
        if ( ! $unique_class_name && $custom_style ) $wp_attrs['style'] = $custom_style;

        $wp_attrs['loading']  = $loading;
        $wp_attrs['decoding'] = $decoding;

        if ( is_array( $extra_aria_raw ) ) {
            foreach ( $extra_aria_raw as $aria_attr ) {
                $aria_key = isset( $aria_attr['key'] )   ? trim( $aria_attr['key'] )   : '';
                $aria_val = isset( $aria_attr['value'] ) ? trim( $aria_attr['value'] ) : '';
                if ( $aria_key && $aria_val && preg_match( '/^aria-[a-z-]+$/', $aria_key ) ) {
                    $wp_attrs[ $aria_key ] = $aria_val;
                }
            }
        }
        if ( is_array( $custom_attrs_raw ) ) {
            foreach ( $custom_attrs_raw as $ca ) {
                $ca_key = isset( $ca['key'] )   ? trim( (string) $ca['key'] )   : '';
                $ca_val = isset( $ca['value'] ) ? trim( (string) $ca['value'] ) : '';
                if ( $ca_key && ( $ca_key === 'crossorigin' || preg_match( '/^data-[a-z0-9-]+$/', $ca_key ) ) ) {
                    $wp_attrs[ $ca_key ] = $ca_val;
                }
            }
        }

        if ( $override_alt ) $wp_attrs['alt'] = $resolved_alt;

        echo wp_get_attachment_image( $image_id, $image_size, false, $wp_attrs );
        return;
    }

    // URL path - build <img> manually
    $alt_attr = $override_alt ? $resolved_alt : '';

    $output = '<img'
        . ' src="' . esc_url( $image_url ) . '"'
        . ' alt="' . esc_attr( $alt_attr ) . '"'
        . $attrs
        . ' />';

    $output = apply_filters( 'tmsblocks/block_output',     $output, $attributes, $block );
    $output = apply_filters( 'tmsblocks/block_output/img', $output, $attributes, $block );

    echo wp_kses( $output, tmsblocks_get_block_output_allowed_tags() );