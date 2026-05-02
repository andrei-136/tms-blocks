<?php
/**
 * Plugin Name: TMS Blocks
 * Description: A set of custom Gutenberg blocks.
 * Version: 1.0
 * Requires at least: 6.3 
 * Requires PHP: 7.4
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; 
}

$tmsblocks_utils_path = plugin_dir_path( __FILE__ ) . 'includes/utils/utils.php';
if ( file_exists( $tmsblocks_utils_path ) ) {
    require_once $tmsblocks_utils_path;
}



// Load dynamic field functions before any render file that depends on them
$tmsblocks_dynamic_field_path = plugin_dir_path( __FILE__ ) . 'includes/dynamic-field.php';
if ( file_exists( $tmsblocks_dynamic_field_path ) ) {
    require_once $tmsblocks_dynamic_field_path;
}



$tmsblocks_dynamic_source_helpers_path = plugin_dir_path( __FILE__ ) . 'includes/dynamic-source-helpers.php';
if ( file_exists( $tmsblocks_dynamic_source_helpers_path ) ) {
    require_once $tmsblocks_dynamic_source_helpers_path;
}


// Helper function to ensure the stylesheet is registered and return its handle.
function tmsblocks_get_styles_handle() {
    $handle = 'tmsblocks-styles';

    if ( ! wp_style_is( $handle, 'registered' ) ) {
        wp_register_style( $handle, false, array(), '1.0' );
    }

    if ( ! wp_style_is( $handle, 'enqueued' ) ) {
        wp_enqueue_style( $handle );
    }

    return $handle;
}

// Enqueue shared utility classes for blocks.
function tmsblocks_enqueue_utilities() {
    $utilities_path = plugin_dir_path( __FILE__ ) . 'assets/css/utilities.css';

    wp_enqueue_style(
        'tmsblocks-utilities',
        plugins_url( 'assets/css/utilities.css', __FILE__ ),
        array(),
        file_exists( $utilities_path ) ? filemtime( $utilities_path ) : null
    ); 
}

// Enqueue block editor script
add_action( 'enqueue_block_assets', 'tmsblocks_enqueue_utilities' );
function tmsblocks_enqueue_editor_assets() {
    wp_enqueue_script(
        'tmsblocks-editor',
        plugins_url( 'build/editor.js', __FILE__ ),
        array( 'wp-hooks', 'wp-blocks' ),
        filemtime( plugin_dir_path( __FILE__ ) . 'build/editor.js' ),
        true
    );
}
 add_action( 'enqueue_block_editor_assets', 'tmsblocks_enqueue_editor_assets' );

// Register custom block category
function tmsblocks_block_categories( $categories ) {
    return array_merge(
        $categories,
        array(
            array(
                'slug'  => 'tms-blocks',
                'title' => 'TMS Blocks',
                'icon'  => 'slides', // Optional: Dashicon slug
            ),
        )
    );
}
add_filter( 'block_categories_all', 'tmsblocks_block_categories', 10, 1 );



/**
 * Process custom styles from attributes and return style string for get_block_wrapper_attributes()
 * 
 * @param array $custom_style_attr The customStyle attribute array
 * @return string Style string or empty string
 */
function tmsblocks_process_custom_styles( $custom_style_attr ) {
    if ( empty( $custom_style_attr ) || ! is_array( $custom_style_attr ) ) {
        return '';
    }

    $keyword_units = array( 'keyword', 'auto', 'none', 'inherit', 'initial', 'unset', 'revert', 'normal', 'fit-content', 'min-content', 'max-content', 'content' );

    $style_array = array();
    foreach ( $custom_style_attr as $prop => $value ) {
        $css_prop = strtolower( preg_replace( '/([a-z])([A-Z])/', '$1-$2', $prop ) );

        if ( is_array( $value ) && isset( $value['value'] ) && $value['value'] !== '' ) {
            $unit = $value['unit'] ?? 'px';

            if ( $unit === 'size-presets' ) {
                $css_value = 'var(--wp--preset--spacing--' . $value['value'] . ')';
            } elseif ( $unit === 'layout-presets' ) {
                if ( $value['value'] === 'content' ) {
                    $css_value = 'var(--wp--style--global--content-size)';
                } elseif ( $value['value'] === 'wide' ) {
                    $css_value = 'var(--wp--style--global--wide-size)';
                } else {
                    continue;
                }
            } elseif ( $unit === 'font-size-presets' ) {
                $css_value = 'var(--wp--preset--font-size--' . $value['value'] . ')';
            } elseif ( in_array( $unit, $keyword_units, true ) || $unit === 'custom' || $unit === 'unitless' || $unit === 'string' ) {
                $css_value = $value['value'];
            } else {
                $css_value = $value['value'] . $unit;
            }

            $style_array[] = $css_prop . ':' . $css_value;

        } elseif ( is_string( $value ) && $value !== '' ) {
            $style_array[] = $css_prop . ':' . $value;
        }
    }

    if ( empty( $style_array ) ) {
        return '';
    }

    return implode( '; ', $style_array ) . ';';
}

/**
 * Get registered breakpoints.
 * Theme/plugin developers can override via filter.
 *
 * @return array
 */
function tmsblocks_get_breakpoints() {
    return apply_filters( 'tmsblocks/breakpoints', [
        [ 'key' => 'wide',   'maxWidth' => 1400 ],
        [ 'key' => 'tablet', 'maxWidth' => 1024 ],
        [ 'key' => 'mobile', 'maxWidth' => 767  ],
    ]);
}
/**
 * Process responsive styles and return media-query-wrapped CSS string.
 *
 * @param array  $responsive_style_attr  The responsiveStyle attribute array
 * @param string $unique_class_name      The block's unique scoped class
 * @param array  $overrides              Per-block breakpoint size overrides
 * @return string CSS string with media queries or empty string
 */
function tmsblocks_process_responsive_styles( $responsive_style_attr, $unique_class_name, $overrides = [], $custom_breakpoints = [] )  {
    if ( empty( $responsive_style_attr ) || ! is_array( $responsive_style_attr ) || ! $unique_class_name ) {
        return '';
    }

    $breakpoints = array_merge(
        tmsblocks_get_breakpoints(),
        $custom_breakpoints  // per-block custom ones
    );
    $all_keys     = array_unique( array_merge(
        array_column( $breakpoints, 'key' ),
        array_keys( $overrides ),
        array_keys( $responsive_style_attr )
    ));

    // Sort largest to smallest — matches CSS cascade
    usort( $breakpoints, function( $a, $b ) {
        return (int) $b['maxWidth'] - (int) $a['maxWidth'];
    } );

    // Build a lookup map from global breakpoints
    $bp_map = [];
    foreach ( $breakpoints as $bp ) {
        $bp_map[ $bp['key'] ] = (int) $bp['maxWidth'];
    }

    $output = '';

    foreach ( $all_keys as $key ) {
        $breakpoint_data = $responsive_style_attr[ $key ] ?? [];
        if ( empty( $breakpoint_data ) ) continue;

        // Override takes priority over global value
        $max_width = isset( $overrides[ $key ] )
            ? (int) $overrides[ $key ]
            : ( $bp_map[ $key ] ?? 0 );

        if ( ! $max_width ) continue;

        // Base styles
        $base_css = tmsblocks_process_custom_styles( $breakpoint_data['base'] ?? [] );
        if ( $base_css ) {
            $output .= "@media (max-width: {$max_width}px) { body .{$unique_class_name} { {$base_css} } }\n";
        }

        // Hover styles
        $hover_css = tmsblocks_process_custom_styles( $breakpoint_data['hover'] ?? [] );
        if ( $hover_css ) {
            $output .= "@media (hover: hover) and (pointer: fine) and (max-width: {$max_width}px) { body .{$unique_class_name}:hover { {$hover_css} } }\n";
        }

        // Focus-visible styles
        $focus_css = tmsblocks_process_custom_styles( $breakpoint_data['focusVisible'] ?? [] );
        if ( $focus_css ) {
            $output .= "@media (max-width: {$max_width}px) { body .{$unique_class_name}:focus-visible { {$focus_css} } }\n";
        }
    }

    // Sort output by max-width descending to ensure correct cascade
    // Parse and re-sort the generated rules
    $rules = array_filter( explode( "\n", trim( $output ) ) );
    usort( $rules, function( $a, $b ) {
        preg_match( '/max-width:\s*(\d+)px/', $a, $ma );
        preg_match( '/max-width:\s*(\d+)px/', $b, $mb );
        return (int)( $mb[1] ?? 0 ) - (int)( $ma[1] ?? 0 );
    });

    return implode( "\n", $rules ) . "\n";
}

// Register blocks dynamically from folders
add_action( 'init', function() {
    // Path to all custom block folders
    $plugin_dir = plugin_dir_path( __FILE__ );

    $build_block_folders = glob( $plugin_dir . 'build/*/block.json' );
    $src_block_folders   = glob( $plugin_dir . 'src/*/block.json' );

    $block_path_root = ! empty( $build_block_folders ) ? 'build' : 'src';
    $block_folders   = ! empty( $build_block_folders ) ? $build_block_folders : $src_block_folders;
    // $carousel_style_path = $plugin_dir . $block_path_root . '/tms-carousel/style.css';

   

    foreach ( $block_folders as $block_json ) {
        $block_dir  = dirname( $block_json );
        $block_name = basename( $block_dir );

        // Register blocks and attach render callbacks if needed
        $args = [];

        
        register_block_type( $block_dir, $args );
    }
} );
















