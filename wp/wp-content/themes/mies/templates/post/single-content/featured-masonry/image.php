<?php
if ( has_post_thumbnail() ):

	$image = wp_get_attachment_image_src( get_post_thumbnail_id(), 'large-size' );

	if ( ! empty( $image[0] ) ) : ?>
		<div class="entry-thumbnail">
			<img src="<?php echo esc_url( $image[0] ) ?>" alt="<?php esc_attr( the_title() ) ?>"/>
		</div>
	<?php endif;
endif;