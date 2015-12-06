<?php

global $page_section_idx, $header_height;

//increment the page section number
$page_section_idx++;

//header general classes
$classes = "hero";

$header_height = 'full-height'; // the default

$hero_content_style = 'hero--dark'; // hero--light hero--dark hero--shadowed

$classes .= ' ' . $header_height . ' ' . $hero_content_style;

/* FIRST TEST FOR CONTACT PAGE TEMPLATE */

//get the Google Maps URL to test if empty
//$gmap_urls = get_post_meta( wpgrade::lang_post_id( get_the_ID() ), 'gmap_urls', true );

wp_enqueue_script('google-maps-api');

?>
		<header id="post-<?php the_ID() ?>-title" class="<?php echo esc_attr( $classes ) ?> hero--map">
			<div class="hero__bg js-hero-bg  hero__bg-map">
				<div class="gmap" id="gmap-<?php the_ID() ?>"
				<?php echo ( $gmap_custom_style == 'on' ) ? 'data-customstyle' : ''; ?>
				     data-pins='{"name":"https://www.google.ro/maps/@47.5993964,-122.3333349,17z"}'></div>
             <!-- data-pins='<?php //echo esc_attr( $pins ) ?>' -->
			</div>


			<div class="hero__overflow"></div>
		</header>
<?php
