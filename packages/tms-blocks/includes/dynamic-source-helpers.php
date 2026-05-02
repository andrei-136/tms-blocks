<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
/**
 * tmsblocks_resolve_dynamic_source()
 *
 * Resolves a dynamic value from a subject + property + options triple.
 *
 * @param string $subject   'post' | 'term' | 'author'
 * @param string $property  The specific field to resolve (see JS PROPERTIES map)
 * @param array  $options   Secondary options: taxonomy, metaKey, dateType, dateFormat,
 *                          termsSeparator, commentsNoText, commentsOneText, commentsManyText
 * @param int    $post_id   The post to resolve against (from block context or get_the_ID())
 * @param string $mode      'content' | 'link' - used to decide escaping (esc_url vs esc_html)
 *
 * @return string|null  Resolved string value, or null if nothing could be resolved.
 */
if ( ! function_exists( 'tmsblocks_format_comments_count_text' ) ) {
    function tmsblocks_format_comments_count_text( $count, $comments_no = '', $comments_one = '', $comments_many = '' ) {
        $count = (int) $count;

        $comments_no   = is_string( $comments_no ) ? trim( $comments_no ) : '';
        $comments_one  = is_string( $comments_one ) ? trim( $comments_one ) : '';
        $comments_many = is_string( $comments_many ) ? trim( $comments_many ) : '';

        // Site locale should have priority over legacy hardcoded English defaults.
        // Treat these values as unset so localized defaults can be used.
        $comments_no_lc   = strtolower( $comments_no );
        $comments_one_lc  = strtolower( $comments_one );
        $comments_many_lc = strtolower( $comments_many );

        if ( in_array( $comments_no_lc, array( 'no comments', 'no comment' ), true ) ) {
            $comments_no = '';
        }

        if ( in_array( $comments_one_lc, array( '1 comment', 'one comment' ), true ) ) {
            $comments_one = '';
        }

        if ( in_array( $comments_many_lc, array( '%s comments', '%d comments' ), true ) ) {
            $comments_many = '';
        }

        if ( $count === 0 && $comments_no !== '' ) {
            return $comments_no;
        }

        if ( $count === 1 && $comments_one !== '' ) {
            return $comments_one;
        }

        if ( $count > 1 && $comments_many !== '' ) {
            return sprintf( $comments_many, number_format_i18n( $count ) );
        }

        $site_locale = get_locale(); // site locale, not user/admin locale
        switch_to_locale( $site_locale );
        $text = sprintf(
            /* translators: %s: number of comments. */
            _n( '%s comment', '%s comments', $count, 'tms-blocks' ),
            number_format_i18n( $count )
        );
        restore_previous_locale();

        return $text;
    }
}

function tmsblocks_resolve_dynamic_source( $subject, $property, $options, $post_id, $mode = 'content' ) {
    $post_id  = (int) $post_id;
    $subject  = trim( (string) $subject );
    $property = trim( (string) $property );

    if ( ! $subject || ! $property || $post_id <= 0 ) {
        return null;
    }

    $options  = is_array( $options ) ? $options : array();
    $meta_key = isset( $options['metaKey'] ) ? trim( $options['metaKey'] ) : '';
    $taxonomy = isset( $options['taxonomy'] ) ? trim( $options['taxonomy'] ) : '';

    switch ( $subject ) {

        // -- Post -----------------------------------------------------------
        case 'post':
            return tmsblocks_resolve_post_property( $post_id, $property, $meta_key, $options );

        // -- Term -----------------------------------------------------------
        case 'term':
            if ( ! $taxonomy ) return null;
            $terms = get_the_terms( $post_id, $taxonomy );
            if ( ! is_array( $terms ) || empty( $terms ) ) return null;
            $term = $terms[0]; // first matching term
            return tmsblocks_resolve_term_property( $term, $property, $meta_key );

        // -- Author ---------------------------------------------------------
        case 'author':
            $author_id = (int) get_post_field( 'post_author', $post_id );
            if ( ! $author_id ) return null;
            return tmsblocks_resolve_author_property( $author_id, $property, $meta_key );
    }

    return null;
}


/**
 * Resolve a property from a post.
 */
function tmsblocks_resolve_post_property( $post_id, $property, $meta_key, $options ) {
    switch ( $property ) {

        case 'title':
            $value = get_the_title( $post_id );
            return $value !== '' ? $value : null;

        case 'slug':
            $value = get_post_field( 'post_name', $post_id );
            return $value !== '' ? $value : null;

        case 'excerpt':
            $post    = get_post( $post_id );
            if ( ! $post ) return null;
            $excerpt = $post->post_excerpt !== ''
                ? $post->post_excerpt
                : wp_trim_words( strip_shortcodes( $post->post_content ) );
            return $excerpt !== '' ? $excerpt : null;

        case 'date':
            $date_type = $options['dateType'] ?? 'published';
            $format    = $options['dateFormat'] ?? get_option( 'date_format' );
            if ( $date_type === 'modified' ) {
                return get_the_modified_date( $format, $post_id ) ?: null;
            }
            return get_the_date( $format, $post_id ) ?: null;

        case 'meta':
            if ( ! $meta_key ) return null;
            $value = get_post_meta( $post_id, $meta_key, true );
            return ( $value !== '' && $value !== false ) ? (string) $value : null;

        case 'comments_number':
            $count = (int) get_comments_number( $post_id );
            return tmsblocks_format_comments_count_text(
                $count,
                isset( $options['commentsNoText'] ) ? (string) $options['commentsNoText'] : '',
                isset( $options['commentsOneText'] ) ? (string) $options['commentsOneText'] : '',
                isset( $options['commentsManyText'] ) ? (string) $options['commentsManyText'] : ''
            );

        case 'terms_list':
            $taxonomy  = $options['taxonomy'] ?? '';
            $separator = $options['termsSeparator'] ?? ', ';
            if ( ! $taxonomy ) return null;
            $terms = get_the_terms( $post_id, $taxonomy );
            if ( ! is_array( $terms ) || empty( $terms ) ) return null;
            return implode( $separator, wp_list_pluck( $terms, 'name' ) );

        case 'permalink':
            return get_permalink( $post_id ) ?: null;

        case 'comments_link':
            return get_comments_link( $post_id ) ?: null;

        case 'term_archive':
            $taxonomy = $options['taxonomy'] ?? '';
            if ( ! $taxonomy ) return null;
            $terms = get_the_terms( $post_id, $taxonomy );
            if ( ! is_array( $terms ) || empty( $terms ) ) return null;
            $url = get_term_link( $terms[0] );
            return ( ! is_wp_error( $url ) ) ? $url : null;
    }

    return null;
}


/**
 * Resolve a property from a term object.
 */
function tmsblocks_resolve_term_property( $term, $property, $meta_key ) {
    if ( ! $term || is_wp_error( $term ) ) return null;

    switch ( $property ) {
        case 'name':
            return $term->name !== '' ? $term->name : null;

        case 'slug':
            return $term->slug !== '' ? $term->slug : null;

        case 'description':
            return $term->description !== '' ? $term->description : null;

        case 'meta':
            if ( ! $meta_key ) return null;
            $value = get_term_meta( $term->term_id, $meta_key, true );
            return ( $value !== '' && $value !== false ) ? (string) $value : null;

        case 'archive':
            $url = get_term_link( $term );
            return ( ! is_wp_error( $url ) ) ? $url : null;
    }

    return null;
}


/**
 * Resolve a property from an author (WP user).
 */
function tmsblocks_resolve_author_property( $author_id, $property, $meta_key ) {
    $user = get_userdata( $author_id );
    if ( ! $user ) return null;

    switch ( $property ) {
        case 'display_name': return $user->display_name  ?: null;
        case 'first_name':   return $user->first_name    ?: null;
        case 'last_name':    return $user->last_name     ?: null;
        case 'nickname':     return $user->nickname      ?: null;
        case 'email':        return $user->user_email    ?: null;

        case 'meta':
            if ( ! $meta_key ) return null;
            $value = get_user_meta( $author_id, $meta_key, true );
            return ( $value !== '' && $value !== false ) ? (string) $value : null;

        case 'archive':
            return get_author_posts_url( $author_id ) ?: null;

        // link mode - email produces a mailto: href
        case 'email_mailto':
            return $user->user_email ? 'mailto:' . $user->user_email : null;
    }

    return null;
}
