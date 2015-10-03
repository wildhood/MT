<?php
/*
 * ===== Theme Translation =====
 * Load the translations from the child theme if present
 */
add_action( 'before_wpgrade_core', 'mies_child_theme_setup' );
function mies_child_theme_setup() {
	load_child_theme_textdomain( 'mies_txtd', get_stylesheet_directory() . '/languages' );
}

/**
 * ===== Loading Resources =====
 * Add all the extra static resources of the child theme - right now only the style.css file

 * ===== Marks Notes =====
 * wp-content\themes\mies\config\wpgrade-config.php - is the location of the theme core font info
 */

function mies_child_enqueue_styles() {
	// Here we are adding the child style.css while still retaining all of the parents assets (style.css, JS files, etc)
	wp_enqueue_style( 'mies-child-style',
		get_stylesheet_directory_uri() . '/style.css',
		array('wpgrade-main-style') //make sure the the child's style.css comes after the parents so you can overwrite rules
	);
}

add_action( 'wp_enqueue_scripts', 'mies_child_enqueue_styles' );
