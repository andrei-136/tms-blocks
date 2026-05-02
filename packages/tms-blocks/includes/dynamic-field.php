
<?php
// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.InvalidPrefixPassed -- Block filter/action names use slashes by WordPress convention.

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
/**
 * TMS Dynamic Field Block Functions
 *
 * Path resolver ops:
 *   terms:taxonomy   post  -> term[]
 *   parent           term  -> term (parent)
 *   author           post  -> user
 *   meta:key         post|term|user -> scalar[]
 *   post:property    post  -> scalar   (title, slug, date, modified, excerpt, id, permalink, comments_link)
 *   term:property    term  -> scalar   (name, slug, description, count, id, archive)
 *   user:property    user  -> scalar   (display_name, first_name, last_name, nickname, email, url, login)
 *   user:property    term  -> user     (lookup user by term slug, then extract property)
 *   link:type        post|term|user -> scalar URL
 *   comments         post  -> scalar (comment count, formatted)
 */

// -- Path resolver ----------------------------------------------------------

function tmsblocks_get_adjacent_post_id_for_id( $post_id, $direction ) {
    $post = get_post( $post_id );
    if ( ! $post instanceof WP_Post ) {
        return 0;
    }

    $query_args = array(
        'post_type'      => $post->post_type,
        'post_status'    => 'publish',
        'posts_per_page' => 1,
        'fields'         => 'ids',
        'orderby'        => 'date',
        'order'          => $direction === 'previous' ? 'DESC' : 'ASC',
        'date_query'     => array(
            array(
                'column'    => 'post_date',
                $direction === 'previous' ? 'before' : 'after' => $post->post_date,
                'inclusive' => false,
            ),
        ),
    );

    $adjacent_ids = get_posts( $query_args );
    if ( empty( $adjacent_ids ) ) {
        return 0;
    }

    return (int) $adjacent_ids[0];
}

function tmsblocks_get_adjacent_post_url_for_id( $post_id, $direction ) {
    $adjacent_id = tmsblocks_get_adjacent_post_id_for_id( $post_id, $direction );
    if ( ! $adjacent_id ) {
        return '';
    }

    return get_permalink( $adjacent_id ) ?: '';
}

function tmsblocks_dynamic_field_normalize_display_value( $value ) {
    if ( is_null( $value ) || $value === false ) {
        return '';
    }

    if ( is_scalar( $value ) ) {
        return (string) $value;
    }

    if ( is_array( $value ) ) {
        $parts = array();
        foreach ( $value as $entry ) {
            $normalized = tmsblocks_dynamic_field_normalize_display_value( $entry );
            if ( $normalized !== '' ) {
                $parts[] = $normalized;
            }
        }
        return implode( ', ', $parts );
    }

    if ( is_object( $value ) && method_exists( $value, '__toString' ) ) {
        return (string) $value;
    }

    $encoded = wp_json_encode( $value );
    return is_string( $encoded ) ? $encoded : '';
}

function tmsblocks_get_dynamic_field_display_values( $attributes, $post_id ) {
    $post_id = (int) $post_id;
    $path    = isset( $attributes['path'] ) ? trim( $attributes['path'] ) : '';

    if ( $post_id <= 0 || $path === '' ) {
        return array();
    }

    $segments = array_filter( array_map( 'trim', explode( '.', $path ) ) );
    if ( empty( $segments ) ) {
        return array();
    }

    $date_format   = isset( $attributes['dateFormat'] )      ? trim( $attributes['dateFormat'] )  : '';
    $comments_no   = isset( $attributes['commentsNoText'] )  ? $attributes['commentsNoText']       : '';
    $comments_one  = isset( $attributes['commentsOneText'] ) ? $attributes['commentsOneText']      : '';
    $comments_many = isset( $attributes['commentsManyText']) ? $attributes['commentsManyText']     : '';

    $items = array(
        array( 'type' => 'post', 'value' => $post_id )
    );

    foreach ( $segments as $segment_index => $segment ) {
        $next_items      = array();
        $parts           = explode( ':', $segment, 2 );
        $op              = $parts[0];
        $arg             = $parts[1] ?? '';
        $is_last_segment = ( $segment_index === count( $segments ) - 1 );

        foreach ( $items as $item ) {

            // -- terms:taxonomy  post -> term[] -----------------------------
            if ( $op === 'terms' && $item['type'] === 'post' && $arg ) {
                $taxonomy = $arg;
                if ( $taxonomy === 'categories' ) {
                    $taxonomy = 'category';
                } elseif ( $taxonomy === 'tags' ) {
                    $taxonomy = 'post_tag';
                }

                if ( ! taxonomy_exists( $taxonomy ) ) {
                    continue;
                }

                $terms = get_the_terms( $item['value'], $taxonomy );
                if ( is_array( $terms ) ) {
                    foreach ( $terms as $term ) {
                        $next_items[] = array( 'type' => 'term', 'value' => $term );
                    }
                }
                continue;
            }

            // -- parent  term -> term --------------------------------------
            if ( $op === 'parent' && $item['type'] === 'term' ) {
                if ( ! is_object( $item['value'] ) ) {
                    continue;
                }
                $parent_id = (int) $item['value']->parent;
                if ( $parent_id ) {
                    $parent = get_term( $parent_id );
                    if ( $parent && ! is_wp_error( $parent ) ) {
                        $next_items[] = array( 'type' => 'term', 'value' => $parent );
                    }
                }
                continue;
            }

            // -- author  post -> user --------------------------------------
            if ( $op === 'author' && $item['type'] === 'post' ) {
                $author_id = (int) get_post_field( 'post_author', $item['value'] );
                if ( $author_id ) {
                    $user = get_userdata( $author_id );
                    if ( $user ) {
                        $next_items[] = array( 'type' => 'user', 'value' => $user );
                    }
                }
                continue;
            }

            // -- meta:key  post|term|user -> scalar[] ----------------------
            if ( $op === 'meta' && $arg ) {
                if ( $item['type'] === 'post' ) {
                    $values = get_post_meta( $item['value'], $arg, false );
                } elseif ( $item['type'] === 'term' ) {
                    if ( ! is_object( $item['value'] ) ) {
                        $values = array();
                    } else {
                        $values = get_term_meta( $item['value']->term_id, $arg, false );
                    }
                } elseif ( $item['type'] === 'user' ) {
                    if ( ! is_object( $item['value'] ) ) {
                        $values = array();
                    } else {
                        $values = get_user_meta( $item['value']->ID, $arg, false );
                    }
                } else {
                    $values = array();
                }
                if ( ! empty( $values ) && is_array( $values ) ) {
                    foreach ( $values as $value ) {
                        $next_items[] = array( 'type' => 'scalar', 'value' => $value );
                    }
                }
                continue;
            }

            // -- post:property  post -> scalar -----------------------------
            if ( $op === 'post' && $item['type'] === 'post' && $arg ) {
                $pid   = $item['value'];
                $value = '';
                $fmt   = $date_format ?: get_option( 'date_format' );
                switch ( $arg ) {
                    case 'title':         $value = get_the_title( $pid ); break;
                    case 'slug':          $value = get_post_field( 'post_name', $pid ); break;
                    case 'date':          {
                        $site_locale = get_locale(); // site locale, not user locale
                        switch_to_locale( $site_locale );
                        $value = get_the_date( $fmt, $pid );
                        restore_previous_locale();
                        break;
                    }
                    case 'modified':      $value = get_the_modified_date( $fmt, $pid ); break;
                    case 'excerpt':       $value = get_the_excerpt( $pid ); break;
                    case 'id':            $value = (string) $pid; break;
                    case 'permalink':     $value = get_permalink( $pid ) ?: ''; break;
                    case 'comments_link': $value = get_comments_link( $pid ) ?: ''; break;
                    case 'featured_image_url':
                        $thumb_id = (int) get_post_thumbnail_id( $pid );
                        $value = $thumb_id ? ( wp_get_attachment_image_url( $thumb_id, 'full' ) ?: '' ) : '';
                        break;
                    case 'featured_image_alt':
                        $thumb_id = (int) get_post_thumbnail_id( $pid );
                        $value = $thumb_id ? ( get_post_meta( $thumb_id, '_wp_attachment_image_alt', true ) ?: '' ) : '';
                        break;
                    case 'attachment_url':
                        $value = wp_get_attachment_url( $pid ) ?: '';
                        break;
                    case 'attachment_alt':
                        $value = get_post_meta( $pid, '_wp_attachment_image_alt', true ) ?: '';
                        break;
                    case 'caption':
                        $value = get_post_field( 'post_excerpt', $pid ) ?: '';
                        break;
                }
                if ( $value !== '' && $value !== false ) {
                    $next_items[] = array( 'type' => 'scalar', 'value' => $value );
                }
                continue;
            }

            // -- term:property  term -> scalar -----------------------------
            if ( $op === 'term' && $item['type'] === 'term' && $arg ) {
                if ( ! is_object( $item['value'] ) ) {
                    continue;
                }
                $term  = $item['value'];
                $value = '';
                switch ( $arg ) {
                    case 'name':        $value = $term->name; break;
                    case 'slug':        $value = $term->slug; break;
                    case 'description': $value = $term->description; break;
                    case 'count':       $value = (string) $term->count; break;
                    case 'id':          $value = (string) $term->term_id; break;
                    case 'archive':
                        $url   = get_term_link( $term );
                        $value = ( ! is_wp_error( $url ) ) ? $url : '';
                        break;
                }
                if ( $value !== '' ) {
                    $next_items[] = array( 'type' => 'scalar', 'value' => $value );
                }
                continue;
            }

            // -- user:property  term -> scalar (via user lookup by slug) ---
            if ( $op === 'user' && $item['type'] === 'term' && $arg ) {
                if ( ! is_object( $item['value'] ) ) {
                    continue;
                }
                $term = $item['value'];
                $user = get_user_by( 'slug', $term->slug );
                if ( $user ) {
                    $value = '';
                    switch ( $arg ) {
                        case 'display_name': $value = $user->display_name; break;
                        case 'first_name':   $value = $user->first_name; break;
                        case 'last_name':    $value = $user->last_name; break;
                        case 'nickname':     $value = $user->nickname; break;
                        case 'email':        $value = $user->user_email; break;
                        case 'url':          $value = $user->user_url; break;
                        case 'login':        $value = $user->user_login; break;
                        case 'archive':      $value = get_author_posts_url( $user->ID ) ?: ''; break;
                    }
                    if ( $value !== '' ) {
                        $next_items[] = array( 'type' => 'scalar', 'value' => $value );
                    }
                }
                continue;
            }

            // -- user:property  user -> scalar -----------------------------
            if ( $op === 'user' && $item['type'] === 'user' && $arg ) {
                if ( ! is_object( $item['value'] ) ) {
                    continue;
                }
                $user  = $item['value'];
                $value = '';
                switch ( $arg ) {
                    case 'display_name': $value = $user->display_name; break;
                    case 'first_name':   $value = $user->first_name; break;
                    case 'last_name':    $value = $user->last_name; break;
                    case 'nickname':     $value = $user->nickname; break;
                    case 'email':        $value = $user->user_email; break;
                    case 'url':          $value = $user->user_url; break;
                    case 'login':        $value = $user->user_login; break;
                    case 'archive':      $value = get_author_posts_url( $user->ID ) ?: ''; break;
                }
                if ( $value !== '' ) {
                    $next_items[] = array( 'type' => 'scalar', 'value' => $value );
                }
                continue;
            }

            // -- link:type  post|term|user -> scalar URL -------------------
            if ( $op === 'link' && $arg ) {
                $value = '';
                switch ( $arg ) {
                    case 'permalink':
                        if ( $item['type'] === 'post' ) {
                            $value = get_permalink( $item['value'] ) ?: '';
                        }
                        break;
                    case 'comments_link':
                        if ( $item['type'] === 'post' ) {
                            $value = get_comments_link( $item['value'] ) ?: '';
                        }
                        break;
                    case 'previous_post':
                        if ( $item['type'] === 'post' ) {
                            $adjacent_id = tmsblocks_get_adjacent_post_id_for_id( (int) $item['value'], 'previous' );
                            if ( $adjacent_id ) {
                                if ( $is_last_segment ) {
                                    $value = get_permalink( $adjacent_id ) ?: '';
                                } else {
                                    $next_items[] = array( 'type' => 'post', 'value' => $adjacent_id );
                                }
                            }
                        }
                        break;
                    case 'next_post':
                        if ( $item['type'] === 'post' ) {
                            $adjacent_id = tmsblocks_get_adjacent_post_id_for_id( (int) $item['value'], 'next' );
                            if ( $adjacent_id ) {
                                if ( $is_last_segment ) {
                                    $value = get_permalink( $adjacent_id ) ?: '';
                                } else {
                                    $next_items[] = array( 'type' => 'post', 'value' => $adjacent_id );
                                }
                            }
                        }
                        break;
                    case 'term_archive':
                        if ( $item['type'] === 'term' ) {
                            $url   = get_term_link( $item['value'] );
                            $value = ( ! is_wp_error( $url ) ) ? $url : '';
                        } elseif ( $item['type'] === 'post' ) {
                            $post_taxonomies = get_object_taxonomies( get_post_type( $item['value'] ) );
                            if ( ! empty( $post_taxonomies ) ) {
                                foreach ( $post_taxonomies as $taxonomy ) {
                                    $terms = get_the_terms( $item['value'], $taxonomy );
                                    if ( is_array( $terms ) && ! empty( $terms ) ) {
                                        $url = get_term_link( $terms[0] );
                                        if ( ! is_wp_error( $url ) ) {
                                            $value = $url;
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                        break;
                    case 'author_archive':
                        if ( $item['type'] === 'user' ) {
                            if ( is_object( $item['value'] ) ) {
                                $value = get_author_posts_url( $item['value']->ID ) ?: '';
                            }
                        } elseif ( $item['type'] === 'post' ) {
                            $author_id = (int) get_post_field( 'post_author', $item['value'] );
                            if ( $author_id ) {
                                $value = get_author_posts_url( $author_id ) ?: '';
                            }
                        }
                        break;
                    case 'author_mailto':
                        if ( $item['type'] === 'user' && is_object( $item['value'] ) && $item['value']->user_email ) {
                            $value = 'mailto:' . $item['value']->user_email;
                        } elseif ( $item['type'] === 'post' ) {
                            $author_id = (int) get_post_field( 'post_author', $item['value'] );
                            if ( $author_id ) {
                                $author_email = get_the_author_meta( 'user_email', $author_id );
                                if ( $author_email ) {
                                    $value = 'mailto:' . $author_email;
                                }
                            }
                        }
                        break;
                }
                if ( $value !== '' ) {
                    $next_items[] = array( 'type' => 'scalar', 'value' => $value );
                }
                continue;
            }

            // -- comments  post -> scalar ----------------------------------
            if ( $op === 'comments' && $item['type'] === 'post' ) {
                $count = (int) get_comments_number( $item['value'] );
                $text = tmsblocks_format_comments_count_text( $count, $comments_no, $comments_one, $comments_many );
                $next_items[] = array( 'type' => 'scalar', 'value' => $text );
                continue;
            }
        }

        $items = $next_items;
        if ( empty( $items ) ) {
            break;
        }
    }

    if ( empty( $items ) ) {
        return array();
    }

    $display_values = array();
    foreach ( $items as $item ) {
        if ( $item['type'] === 'scalar' ) {
            $display_values[] = $item['value'];
        } elseif ( $item['type'] === 'term' && is_object( $item['value'] ) ) {
            $display_values[] = $item['value']->name;
        } elseif ( $item['type'] === 'post' ) {
            $display_values[] = get_the_title( $item['value'] );
        } elseif ( $item['type'] === 'user' && is_object( $item['value'] ) ) {
            $display_values[] = $item['value']->display_name;
        }
    }

    return array_filter(
        array_map( 'tmsblocks_dynamic_field_normalize_display_value', $display_values ),
        'strlen'
    );
}

// -- Item renderer ----------------------------------------------------------

function tmsblocks_render_dynamic_field_item( $value, $href, $link_text, $attributes, $item_style, $item_class ) {
    $item_type   = $attributes['itemType']   ?? 'text';
    $item_tag    = tag_escape( $attributes['itemTagName'] ?? 'span' );
    $link_target = $attributes['linkTarget'] ?? '_self';

    $style_attr = $item_style ? ' style="' . esc_attr( $item_style ) . '"' : '';
    $class_attr = $item_class ? ' class="' . esc_attr( $item_class ) . '"' : '';
    $data_attr  = ' data-tmsblocks-dynamic-field-item="1"';

    switch ( $item_type ) {
        case 'image':
            return sprintf(
                '<img src="%s" alt=""%s%s%s />',
                esc_url( $value ),
                $class_attr,
                $data_attr,
                $style_attr
            );
        case 'url':
            $target_attr = ( $link_target === '_blank' )
                ? ' target="_blank" rel="noopener noreferrer"'
                : '';
            return sprintf(
                '<a href="%s"%s%s%s%s>%s</a>',
                esc_url( $href ),
                $target_attr,
                $class_attr,
                $data_attr,
                $style_attr,
                esc_html( $link_text )
            );
        default: // text
            return sprintf(
                '<%1$s%2$s%3$s%4$s>%5$s</%1$s>',
                $item_tag,
                $class_attr,
                $data_attr,
                $style_attr,
                wp_kses( $value, tmsblocks_get_phrasing_allowed_tags() )
            );
    }
}



// -- REST endpoints ---------------------------------------------------------

function tmsblocks_dynamic_field_permissions() {
    return current_user_can( 'edit_posts' );
}

function tmsblocks_get_dynamic_field_preview( WP_REST_Request $request ) {
    $post_id = absint( $request->get_param( 'postId' ) );
    $path    = $request->get_param( 'path' );
    $path    = is_string( $path ) ? $path : '';

    $attributes = array(
        'path'             => $path,
        'dateFormat'       => $request->get_param( 'dateFormat' )       ?? '',
        'commentsNoText'   => $request->get_param( 'commentsNoText' )   ?? '',
        'commentsOneText'  => $request->get_param( 'commentsOneText' )  ?? '',
        'commentsManyText' => $request->get_param( 'commentsManyText' ) ?? '',
    );

    $values = tmsblocks_get_dynamic_field_display_values( $attributes, $post_id );
    $allowed_tags = tmsblocks_get_phrasing_allowed_tags();
    $values = array_map( function( $v ) use ( $allowed_tags ) {
        return wp_kses( (string) $v, $allowed_tags );
    }, $values );
    return rest_ensure_response( array( 'values' => $values ) );
}

function tmsblocks_get_post_meta_keys( WP_REST_Request $request ) {
    $post_type = $request->get_param( 'postType' );
    $post_type = $post_type ? sanitize_key( $post_type ) : 'post';

    if ( ! post_type_exists( $post_type ) ) {
        return new WP_Error( 'tmsblocks_invalid_post_type', 'Invalid post type.', array( 'status' => 400 ) );
    }

    $cache_key = 'tmsblocks_pmk_' . $post_type;
    $cached    = get_transient( $cache_key );
    if ( $cached !== false ) {
        return rest_ensure_response( $cached );
    }

    global $wpdb;
    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- Needed for DISTINCT meta_key lookup; results are cached via transient.
    $keys = array_values( array_filter( $wpdb->get_col( $wpdb->prepare(
        "SELECT DISTINCT pm.meta_key
         FROM {$wpdb->postmeta} pm
         INNER JOIN {$wpdb->posts} p ON p.ID = pm.post_id
         WHERE p.post_type = %s
           AND pm.meta_key NOT LIKE %s
         ORDER BY pm.meta_key ASC",
        $post_type,
        '\\_%'
    ) ) ) );

    set_transient( $cache_key, $keys, HOUR_IN_SECONDS );

    return rest_ensure_response( $keys );
}

function tmsblocks_get_term_meta_keys( WP_REST_Request $request ) {
    $taxonomy = sanitize_key( $request->get_param( 'taxonomy' ) ?? '' );

    if ( ! $taxonomy || ! taxonomy_exists( $taxonomy ) ) {
        return new WP_Error( 'tmsblocks_invalid_taxonomy', 'Invalid taxonomy.', array( 'status' => 400 ) );
    }

    $cache_key = 'tmsblocks_tmk_' . $taxonomy;
    $cached    = get_transient( $cache_key );
    if ( $cached !== false ) {
        return rest_ensure_response( $cached );
    }

    global $wpdb;
    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- Needed for DISTINCT term meta_key lookup; results are cached via transient.
    $keys = array_values( array_filter( $wpdb->get_col( $wpdb->prepare(
        "SELECT DISTINCT tm.meta_key
         FROM {$wpdb->termmeta} tm
         INNER JOIN {$wpdb->term_taxonomy} tt ON tt.term_id = tm.term_id
         WHERE tt.taxonomy = %s
           AND tm.meta_key NOT LIKE %s
         ORDER BY tm.meta_key ASC",
        $taxonomy,
        '\\_%'
    ) ) ) );

    set_transient( $cache_key, $keys, HOUR_IN_SECONDS );

    return rest_ensure_response( $keys );
}

function tmsblocks_get_user_meta_keys( WP_REST_Request $request ) {
    $registered = get_registered_meta_keys( 'user' );

    $keys = array();
    foreach ( $registered as $key => $args ) {
        if ( ! empty( $args['show_in_rest'] ) ) {
            $keys[] = (string) $key;
        }
    }

    $keys = apply_filters( 'tmsblocks_user_meta_keys', $keys, $registered );
    $keys = array_values( array_filter( array_map( 'strval', array_unique( $keys ) ), 'strlen' ) );
    sort( $keys, SORT_NATURAL | SORT_FLAG_CASE );

    return rest_ensure_response( $keys );
}

add_action( 'rest_api_init', function () {
    register_rest_route( 'tmsblocks/v1', '/meta-keys', array(
        'methods'             => 'GET',
        'permission_callback' => 'tmsblocks_dynamic_field_permissions',
        'callback'            => 'tmsblocks_get_post_meta_keys',
        'args'                => array(
            'postType' => array( 'sanitize_callback' => 'sanitize_key' ),
        ),
    ) );

    register_rest_route( 'tmsblocks/v1', '/term-meta-keys', array(
        'methods'             => 'GET',
        'permission_callback' => 'tmsblocks_dynamic_field_permissions',
        'callback'            => 'tmsblocks_get_term_meta_keys',
        'args'                => array(
            'taxonomy' => array( 'sanitize_callback' => 'sanitize_key', 'required' => true ),
        ),
    ) );

    register_rest_route( 'tmsblocks/v1', '/user-meta-keys', array(
        'methods'             => 'GET',
        'permission_callback' => 'tmsblocks_dynamic_field_permissions',
        'callback'            => 'tmsblocks_get_user_meta_keys',
    ) );

    register_rest_route( 'tmsblocks/v1', '/dynamic-field-preview', array(
        'methods'             => 'POST',
        'permission_callback' => 'tmsblocks_dynamic_field_permissions',
        'callback'            => 'tmsblocks_get_dynamic_field_preview',
        'args'                => array(
            'postId'           => array( 'sanitize_callback' => 'absint', 'required' => true ),
            'path'             => array( 'sanitize_callback' => 'sanitize_text_field' ),
            'dateFormat'       => array( 'sanitize_callback' => 'sanitize_text_field' ),
            'commentsNoText'   => array( 'sanitize_callback' => 'sanitize_text_field' ),
            'commentsOneText'  => array( 'sanitize_callback' => 'sanitize_text_field' ),
            'commentsManyText' => array( 'sanitize_callback' => 'sanitize_text_field' ),
        ),
    ) );
} );

add_action( 'save_post', function ( $post_id ) {
    if ( wp_is_post_autosave( $post_id ) || wp_is_post_revision( $post_id ) ) {
        return;
    }
    delete_transient( 'tmsblocks_pmk_' . get_post_type( $post_id ) );
} );

add_action( 'edited_term', function ( $term_id, $tt_id, $taxonomy ) {
    delete_transient( 'tmsblocks_tmk_' . $taxonomy );
}, 10, 3 );
