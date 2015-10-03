<?php
/**
 * The template for displaying the footer widget areas.
 *
 * @package Mies
 * @since   Mies 1.0
 **/
?>

<?php get_template_part( 'sidebar-footer' ); ?>

<div class="js-arrows-templates  hidden">
	<?php get_template_part('assets/images/arrow-left-svg'); ?>
	<?php get_template_part('assets/images/arrow-right-svg'); ?>
</div>
<div class="js-map-pin  hidden">
	<img class="gmap__marker__img" src="<?php echo esc_url( get_template_directory_uri() . '/assets/images/map-pin.png' ) ?>"/>
</div>

<div class="covers"></div>

<?php wp_footer(); ?>

</body>
</html>