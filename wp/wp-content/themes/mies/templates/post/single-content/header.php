<?php
/**
 * The template for the single post header info.
 *
 * @package Mies
 * @since   Mies 1.0
 */
?>

<header class="entry-header">
	<div class="entry-meta">
		<?php if (wpgrade::option('blog_show_date')) : ?>
		<span class="entry-date"><?php the_date(); ?></span>
		<?php endif; ?>
		<span class="cat-links"><?php echo get_the_category_list( _x( ', ', 'Used between list items, there is a space after the comma.', 'mies_txtd' ) ); ?></span>
	</div><!-- .entry-meta -->
	<h1 class="entry-title"><?php the_title(); ?></h1>
	<?php get_template_part( 'templates/post/single-content/featured-masonry/image'); ?>
</header><!-- .entry-header -->