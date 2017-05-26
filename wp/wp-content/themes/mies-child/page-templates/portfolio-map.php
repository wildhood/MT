<?php
/**
 * Template Name: Portfolio Map
 *
 * @package Mies
 * @since   Mies 1.0
 */

get_header();

global $post, $wpgrade_private_post, $page_section_idx, $header_height;

//some global variables that we use in our page sections
//set them just to be sure they are defined
$page_section_idx = 0;

if ( post_password_required() && ! $wpgrade_private_post['allowed'] ) {
	// password protection
	get_template_part( 'templates/password-request-form' );

} else {

get_template_part ( 'templates/mt-map' );

} // close if password protection

get_footer();
