<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// function tmsblocks_wrap_letters( $content, $span_class ) {
//     // Return empty if no content
//     if ( empty( $content ) ) {
//         return $content;
//     }
    
//     // Clean the span class
//     $span_class = trim( $span_class );
//     if ( empty( $span_class ) ) {
//         $span_class = 'letter'; // Default class
//     }
    
//     // If content has no HTML tags, treat it as plain text
//     if ( strip_tags( $content ) === $content ) {
//         return tmsblocks_wrap_plain_text( $content, $span_class );
//     }
    
//     // Create a DOMDocument to parse the HTML
//     $dom = new DOMDocument( '1.0', 'UTF-8' );
    
//     // Suppress warnings for malformed HTML and load content
//     libxml_use_internal_errors( true );
    
//     $decoded_content = html_entity_decode( $content, ENT_QUOTES | ENT_HTML5, 'UTF-8' );

//     // Fix: Better HTML wrapping to handle fragments properly
//     $wrapped_content = '<!DOCTYPE html><html><body>' . $decoded_content . '</body></html>';
//     $dom->loadHTML( $wrapped_content, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD );
    
//     // Clear any libxml errors
//     libxml_clear_errors();
    
//     // Get the body element instead of div
//     $container = $dom->getElementsByTagName( 'body' )->item( 0 );
    
//     if ( ! $container ) {
//         // Fallback to plain text processing
//         return tmsblocks_wrap_plain_text( strip_tags( $content ), $span_class );
//     }
    
//     // Process all text nodes recursively
//     tmsblocks_process_text_nodes( $container, $span_class, $dom );
    
//     // Get the HTML content without the wrapper
//     $result = '';
//     foreach ( $container->childNodes as $child ) {
//         $result .= $dom->saveHTML( $child );
//     }
    
//     return $result;
// }

/**
 * Handle plain text letter wrapping
 * 
 * @param string $text Plain text to wrap
 * @param string $span_class CSS class for letter spans
 * @return string HTML with letters wrapped in spans
 */
function tmsblocks_wrap_plain_text( $text, $span_class ) {
    $result = '';
    
    // Convert text to array of characters (handles UTF-8 properly)
    $chars = preg_split( '//u', $text, -1, PREG_SPLIT_NO_EMPTY );
    
    $letter_index = 0;
    foreach ( $chars as $char ) {
        if ( trim( $char ) !== '' ) {
            // Wrap non-whitespace characters in spans
            $result .= sprintf(
                '<span class="%s" data-index="%d">%s</span>',
                esc_attr( $span_class ),
                $letter_index++,
                esc_html( $char )
            );
        } else {
            // Preserve whitespace
            $result .= $char;
        }
    }
    
    return $result;
}

/**
 * Recursively process text nodes to wrap letters in spans
 * 
 * @param DOMNode $node Current node to process
 * @param string $span_class CSS class for letter spans
 * @param DOMDocument $dom DOM document for creating new elements
 */
function tmsblocks_process_text_nodes( $node, $span_class, $dom ) {
    // Create an array to store nodes to process (to avoid modifying while iterating)
    $nodes_to_process = [];
    
    foreach ( $node->childNodes as $child ) {
        if ( $child->nodeType === XML_TEXT_NODE ) {
            $nodes_to_process[] = $child;
        } elseif ( $child->nodeType === XML_ELEMENT_NODE ) {
            // Recursively process child elements
            tmsblocks_process_text_nodes( $child, $span_class, $dom );
        }
    }
    
    // Process text nodes
    foreach ( $nodes_to_process as $text_node ) {
        $text_content = $text_node->nodeValue;
        
        // Skip empty text nodes, but preserve whitespace-only nodes
        if ( $text_content === '' ) {
            continue;
        }
        
        // Create document fragment to hold the new span elements
        $fragment = $dom->createDocumentFragment();
        
        // Convert text to array of characters (handles UTF-8 properly)
        $chars = preg_split( '//u', $text_content, -1, PREG_SPLIT_NO_EMPTY );
        
        $letter_index = 0;
        foreach ( $chars as $char ) {
            if ( trim( $char ) !== '' ) {
                $span = $dom->createElement( 'span' );
                $span->setAttribute( 'class', $span_class );
                $span->setAttribute( 'data-index', $letter_index++ );
                $span->appendChild( $dom->createTextNode( $char ) );
                $fragment->appendChild( $span );
            } else {
                $fragment->appendChild(
                    $dom->createTextNode( $char === ' ' ? "\u{00A0}" : $char )
                );
            }
        }
        
        // Replace the text node with the fragment
        $text_node->parentNode->replaceChild( $fragment, $text_node );
    }
}

function tmsblocks_get_phrasing_allowed_tags() {
    $tags = array(
        'a'      => array( 'href' => true, 'title' => true, 'target' => true, 'rel' => true ),
        'br'     => array(),
        'em'     => array(),
        'strong' => array(),
        'b'      => array(),
        'i'      => array(),
        'u'      => array(),
        's'      => array(),
        'span'   => array( 'class' => true, 'style' => true ),
        'abbr'   => array( 'title' => true ),
        'code'   => array(),
        'mark'   => array( 'class' => true, 'style' => true ),
        'small'  => array(),
        'sub'    => array(),
        'sup'    => array(),
    );

    return apply_filters( 'tmsblocks/phrasing_allowed_tags', $tags );
}

function tmsblocks_get_block_content_allowed_tags() {
    $tags = array(
        'br'     => array(),
        'em'     => array(),
        'strong' => array(),
        'b'      => array(),
        'i'      => array(),
        'u'      => array(),
        's'      => array(),
        'span'   => array( 'class' => true, 'style' => true ),
        'abbr'   => array( 'title' => true ),
        'code'   => array(),
        'mark'   => array( 'class' => true, 'style' => true ),
        'small'  => array(),
        'sub'    => array(),
        'sup'    => array(),
    );

    return apply_filters( 'tmsblocks/block_content_allowed_tags', $tags );
}

function tmsblocks_truncate( $value, $args = [] ) {
    $args = wp_parse_args( $args, [
        'length' => 200,
        'unit'   => 'characters',
        'suffix' => '...',
    ] );

    $plain = wp_strip_all_tags( $value );
    $plain = trim( preg_replace( '/\s+/', ' ', $plain ) );

    $length = max( 0, (int) $args['length'] );
    $unit   = $args['unit'] === 'words' ? 'words' : 'characters';
    $suffix = isset( $args['suffix'] ) ? (string) $args['suffix'] : '';

    if ( $plain === '' || $length === 0 ) {
        return $plain === '' ? '' : $suffix;
    }

    $within_limit = $unit === 'words'
        ? count( preg_split( '/\s+/', $plain ) ) <= $length
        : mb_strlen( $plain ) <= $length;

    if ( $within_limit ) {
        return $value;
    }

    if ( $unit === 'words' ) {
        $words = preg_split( '/\s+/', $plain );
        $truncated = implode( ' ', array_slice( $words, 0, $length ) );
        return rtrim( $truncated, ',(' ) . $suffix;
    }

    $truncated = trim( mb_substr( $plain, 0, $length ) );
    $last_space = mb_strrpos( $truncated, ' ' );

    if ( $last_space !== false && $last_space > (int) floor( $length / 2 ) ) {
        $truncated = mb_substr( $truncated, 0, $last_space );
    }

    return rtrim( $truncated, ',(' ) . $suffix;
}

function tmsblocks_add_inline_style_once( $handle, $css, $key = '' ) {
    static $added = array();

    $css = is_string( $css ) ? trim( $css ) : '';
    if ( '' === $css ) {
        return false;
    }

    $dedupe_key = (string) $key;
    if ( '' === $dedupe_key ) {
        $dedupe_key = md5( $handle . '|' . $css );
    }

    $registry_key = $handle . '|' . $dedupe_key;
    if ( isset( $added[ $registry_key ] ) ) {
        return false;
    }

    $added[ $registry_key ] = true;

    return wp_add_inline_style( $handle, $css );
}


function tmsblocks_get_block_output_allowed_tags() {
    // Global attributes permitted on every element in the list.
    $global = array(
        'id'               => true,
        'class'            => true,
        'style'            => true,
        'aria-label'       => true,
        'aria-labelledby'  => true,
        'aria-describedby' => true,
        'aria-hidden'      => true,
        'aria-expanded'    => true,
        'aria-controls'    => true,
        'aria-live'        => true,
        'aria-atomic'      => true,
        'aria-current'     => true,
        'aria-disabled'    => true,
        'aria-pressed'     => true,
        'aria-selected'    => true,
        'aria-checked'     => true,
        'aria-required'    => true,
        'aria-invalid'     => true,
        'aria-busy'        => true,
        'aria-haspopup'    => true,
        'aria-orientation' => true,
        'aria-sort'        => true,
        'aria-valuemax'    => true,
        'aria-valuemin'    => true,
        'aria-valuenow'    => true,
        'aria-valuetext'   => true,
        'aria-roledescription' => true,
        'role'             => true,
        'tabindex'         => true,
        'title'            => true,
        'lang'             => true,
        'dir'              => true,
        'data-*'           => true,
    );

    $tags = array(
        // Structural
        'div'        => $global,
        'section'    => $global,
        'article'    => $global,
        'aside'      => $global,
        'header'     => $global,
        'footer'     => $global,
        'main'       => $global,
        'nav'        => $global,
        'figure'     => $global,
        'figcaption' => $global,
        'details'    => $global,
        'summary'    => $global,
        // Text
        'p'          => $global,
        'span'       => $global,
        'h1'         => $global,
        'h2'         => $global,
        'h3'         => $global,
        'h4'         => $global,
        'h5'         => $global,
        'h6'         => $global,
        'blockquote' => array_merge( $global, array( 'cite' => true ) ),
        'cite'       => $global,
        'pre'        => $global,
        'code'       => $global,
        'kbd'        => $global,
        'samp'       => $global,
        'mark'       => $global,
        'small'      => $global,
        'sub'        => $global,
        'sup'        => $global,
        'abbr'       => array_merge( $global, array( 'title' => true ) ),
        'time'       => array_merge( $global, array( 'datetime' => true ) ),
        'address'    => $global,
        // Inline formatting
        'strong'     => $global,
        'b'          => $global,
        'em'         => $global,
        'i'          => $global,
        'u'          => $global,
        's'          => $global,
        'del'        => array_merge( $global, array( 'datetime' => true ) ),
        'ins'        => array_merge( $global, array( 'datetime' => true ) ),
        'q'          => array_merge( $global, array( 'cite' => true ) ),
        'br'         => array( 'class' => true ),
        'hr'         => $global,
        'wbr'        => array(),
        // Links
        'a'          => array_merge( $global, array(
            'href'           => true,
            'target'         => true,
            'rel'            => true,
            'referrerpolicy' => true,
            'download'       => true,
            'hreflang'       => true,
            'type'           => true,
        ) ),
        // Media
        'img'        => array_merge( $global, array(
            'src'      => true,
            'srcset'   => true,
            'sizes'    => true,
            'alt'      => true,
            'width'    => true,
            'height'   => true,
            'loading'  => true,
            'decoding' => true,
            'fetchpriority' => true,
        ) ),
        'picture'    => $global,
        'source'     => array(
            'src'    => true,
            'srcset' => true,
            'sizes'  => true,
            'media'  => true,
            'type'   => true,
        ),
        'video'      => array_merge( $global, array(
            'src'      => true,
            'poster'   => true,
            'autoplay' => true,
            'controls' => true,
            'loop'     => true,
            'muted'    => true,
            'preload'  => true,
            'width'    => true,
            'height'   => true,
            'playsinline' => true,
        ) ),
        'audio'      => array_merge( $global, array(
            'src'      => true,
            'controls' => true,
            'autoplay' => true,
            'loop'     => true,
            'muted'    => true,
            'preload'  => true,
        ) ),
        // Lists
        'ul'         => $global,
        'ol'         => array_merge( $global, array( 'reversed' => true, 'start' => true, 'type' => true ) ),
        'li'         => array_merge( $global, array( 'value' => true ) ),
        'dl'         => $global,
        'dt'         => $global,
        'dd'         => $global,
        // Tables
        'table'      => array_merge( $global, array( 'cellpadding' => true, 'cellspacing' => true, 'border' => true ) ),
        'thead'      => $global,
        'tbody'      => $global,
        'tfoot'      => $global,
        'tr'         => $global,
        'th'         => array_merge( $global, array( 'scope' => true, 'colspan' => true, 'rowspan' => true, 'headers' => true ) ),
        'td'         => array_merge( $global, array( 'colspan' => true, 'rowspan' => true, 'headers' => true ) ),
        'caption'    => $global,
        'colgroup'   => array_merge( $global, array( 'span' => true ) ),
        'col'        => array_merge( $global, array( 'span' => true ) ),
        // Forms (read-only / display use cases)
        'button'     => array_merge( $global, array( 'type' => true, 'disabled' => true, 'name' => true, 'value' => true ) ),
        'label'      => array_merge( $global, array( 'for' => true ) ),
        // SVG subset (icons)
        'svg'        => array_merge( $global, array(
            'xmlns'       => true,
            'viewbox'     => true,
            'fill'        => true,
            'stroke'      => true,
            'width'       => true,
            'height'      => true,
            'aria-hidden' => true,
            'focusable'   => true,
        ) ),
        'path'       => array( 'd' => true, 'fill' => true, 'stroke' => true, 'stroke-width' => true, 'fill-rule' => true, 'clip-rule' => true ),
        'circle'     => array( 'cx' => true, 'cy' => true, 'r' => true, 'fill' => true, 'stroke' => true ),
        'rect'       => array( 'x' => true, 'y' => true, 'width' => true, 'height' => true, 'rx' => true, 'ry' => true, 'fill' => true ),
        'line'       => array( 'x1' => true, 'y1' => true, 'x2' => true, 'y2' => true, 'stroke' => true, 'stroke-width' => true ),
        'polyline'   => array( 'points' => true, 'fill' => true, 'stroke' => true ),
        'polygon'    => array( 'points' => true, 'fill' => true, 'stroke' => true ),
        'g'          => array( 'fill' => true, 'stroke' => true, 'transform' => true ),
        'use'        => array( 'href' => true, 'xlink:href' => true ),
        'defs'       => array(),
        'title'      => array(),
        'desc'       => array(),
    );

    return apply_filters( 'tmsblocks/block_output_allowed_tags', $tags );
}