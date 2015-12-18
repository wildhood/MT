<?php

global $page_section_idx, $header_height;

//increment the page section number
$page_section_idx++;

//header general classes
$classes = "hero";

$header_height = 'full-height'; // the default

$hero_content_style = 'hero--dark'; // hero--light hero--dark hero--shadowed

$gmap_custom_style = 'on';

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
				     data-pins='{
								"Biagi Residence":"https://www.google.com/maps/@47.629065,-122.281778,17z",
								"Johnson Residence":"https://www.google.com/maps/@47.631326,-122.278974,17z",
								"Sears Residence":"https://www.google.com/maps/@47.620868,-122.212632,17z",
								"Scheppat Residence":"https://www.google.com/maps/@47.5427029,-121.9800723,17z",
								"Smith Mercer Island Residence (GCW)":"https://www.google.com/maps/@47.582025,-122.245485,17z",
								"Touw Residence":"https://www.google.com/maps/@47.670615,-122.255947,17z",
								"8610 17th":"https://www.google.com/maps/@47.626347,-122.225512,17z",
								"McCrate Residence":"https://www.google.com/maps/@47.6343613,-120.6292312,17z",
								"Orchard Place House":"https://www.google.com/maps/@47.629378,-122.2166031,17z",
								"Alexander Residence":"https://www.google.com/maps/@47.6100952,-122.6401416,17z",
								"Koppel Residence":"https://www.google.com/maps/@47.607861,-122.07426,17z",
								"Enclave - Lot 5":"https://www.google.com/maps/@47.5521387,-122.2139881,17z",
								"Tougas Residence":"https://www.google.com/maps/@47.587505,-122.2962868,17z",
								"Meydenbauer Point Residence":"https://www.google.com/maps/@47.603363,-122.213055,17z",
								"1700 99th Ave NE":"https://www.google.com/maps/@47.625509,-122.208735,17z",
								"Orfanos Residence":"https://www.google.com/maps/@47.5471695,-121.9879113,17z",
								"Sunset Bluff Residence":"https://www.google.com/maps/@47.585035,-122.395537,17z",
								"Hanses Residence":"https://www.google.com/maps/@46.6020711,-120.5058987,17z",
								"Blue Atlas Residence":"https://www.google.com/maps/@47.630363,-122.288407,17z",
								"Paxton Residence":"https://www.google.com/maps/@47.5427029,-121.9800723,17z",
								"Tilden Residence":"https://www.google.com/maps/@44.0581728,-121.3153096,17z",
								"Sonny Goodin Residence":"https://www.google.com/maps/@47.5169799,-120.574039,17z",
								"#121 - 2821 11th Ave E (Lady Stardust)":"https://www.google.com/maps/@47.646298,-122.3183412,17z",
								"290 NW Dogwood St":"https://www.google.com/maps/@47.534059,-122.041576,17z",
								"531 Howe St":"https://www.google.com/maps/@47.635481,-122.346184,17z",
								"2005 E Denny Way  (The Angry Hawaiian II)":"https://www.google.com/maps/@47.6184873,-122.3054003,17z",
								"#150 - 1935 42nd Ave E (Mad Twins)":"https://www.google.com/maps/@47.636832,-122.278801,17z",
								"321-329 W Olympic Pl":"https://www.google.com/maps/@47.6267195,-122.3619293,17z",
								"1622 E Yesler Way":"https://www.google.com/maps/@47.601936,-122.310659,17z",
								"1412 E Mercer St":"https://www.google.com/maps/@47.624412,-122.3139069,17z",
								"#281 - 2609 E Thomas St (East)":"https://www.google.com/maps/@47.621154,-122.298314,17z",
								"#281 - 2603 E Thomas St (West)":"https://www.google.com/maps/@47.621154,-122.298314,17z",
								"418 W Barrett St":"https://www.google.com/maps/@47.6467942,-122.3631433,17z",
								"Alki 4 P-1 Rowhouses":"https://www.google.com/maps/@47.58172,-122.402333,17z",
								"#104 - 7018 California Ave SW (Morgan 5.2)":"https://www.google.com/maps/@47.540178,-122.386803,17z",
								"2429 8th Ave N":"https://www.google.com/maps/@47.6404415,-122.3433941,17z",
								"Kerala Townhomes":"https://www.google.com/maps/@47.761865,-122.243161,17z",
								"Greenbelt Station":"https://www.google.com/maps/@47.5244178,-122.2805585,17z",
								"Trellis - Mercer Island Townhomes":"https://www.google.com/maps/@47.582581,-122.236885,17z",
								"Viscaia Townhomes":"https://www.google.com/maps/@47.620529,-122.1218406,17z",
								"Residences at Lake Boren":"https://www.google.com/maps/@47.5312399,-122.166449,17z",
								"Factoria Townhomes":"https://www.google.com/maps/@47.5727729,-122.165937,17z",
								"Sammamish Townhomes":"https://www.google.com/maps/@47.6162683,-122.0355736,17z",
								"7500 15th Ave NW":"https://www.google.com/maps/@47.6833477,-122.376457,17z",
								"Project 1623 LLC":"https://www.google.com/maps/@47.616026,-122.314649,17z",
								"#115 - 1144 10th Ave E (8 on 10th)":"https://www.google.com/maps/@47.629926,-122.319887,17z",
								"2847 Franklin Ave E":"https://www.google.com/maps/@47.6469364,-122.3238151,17z",
								"4319 Woodland Park Ave N":"https://www.google.com/maps/@47.660205,-122.344898,17z",
								"3918 1st Ave NE":"https://www.google.com/maps/@47.654312,-122.327573,17z",
								"1761 NW 59th St":"https://www.google.com/maps/@47.671407,-122.381555,17z",
								"410 12th Ave E":"https://www.google.com/maps/@47.622331,-122.316446,17z",
								"414 12th Ave E":"https://www.google.com/maps/@47.622468,-122.316444,17z",
								"Trenton (Kirkland Condos)":"https://www.google.com/maps/@47.6497573,-122.2038433,17z",
								"Waterfront 2 Condominiums":"https://www.google.com/maps/@47.704534,-122.219526,17z",
								"Kirkland 12":"https://www.google.com/maps/@47.678319,-122.2050854,17z",
								"1806 23rd Ave":"https://www.google.com/maps/@47.617948,-122.30223,17z",
								"4047 8th Ave. NE":"https://www.google.com/maps/@47.656954,-122.32012,17z",
								"121 12th Ave E":"https://www.google.com/maps/@47.619403,-122.317315,17z",
								"750 11th Ave E":"https://www.google.com/maps/@39.7336757,-104.9781172,17z",
								"8727 Phinney Ave N":"https://www.google.com/maps/@47.693211,-122.354381,17z",
								"2418 NW 58th St":"https://www.google.com/maps/@47.6711214,-122.3885014,17z",
								"2651 NW 56th St":"https://www.google.com/maps/@47.6694566,-122.3919955,17z",
								"219 1st Ave N":"https://www.google.com/maps/@47.6201569,-122.3554486,17z",
								"3827 Evanston Ave N":"https://www.google.com/maps/@47.6536,-122.351622,17z",
								"507 22nd Ave (Jimmy B)":"https://www.google.com/maps/@47.606516,-122.304063,17z",
								"1436 NW 62nd ST (Vitality)":"https://www.google.com/maps/@47.674043,-122.375309,17z",
								"Linnea Apartments - Bldg 1":"https://www.google.com/maps/@44.0560099,-121.2776418,17z",
								"#243 - 6800 Greenwood Ave N":"https://www.google.com/maps/@47.6787609,-122.3552822,17z",
								"743 N 35th St":"https://www.google.com/maps/@47.649935,-122.3480301,17z",
								"N 45th St Apartments":"https://www.google.com/maps/@47.6612442,-122.3384045,17z",
								"Promenade at Town Square":"https://www.google.com/maps/@47.7835945,-122.3084255,17z",
								"First Central Station":"https://www.google.com/maps/@47.6035047,-122.3166854,17z",
								"6301 15th Ave NW":"https://www.google.com/maps/@47.6747516,-122.3764668,17z",
								"4710 11th Ave NE (11th Ave Apts)":"https://www.google.com/maps/@47.6634905,-122.3160979,17z",
								"Lavender Suites":"https://www.google.com/maps/@47.6619497,-122.3086932,17z",
								"Seamar Family Housing":"https://www.google.com/maps/@47.5230816,-122.3202665,17z",
								"Puyallup Tribe":"https://www.google.com/maps/@47.275968,-122.364965,17z",
								"SOPVillage Housing":"https://www.google.com/maps/@47.5137368,-122.3514049,17z",
								"Comfort Inn - Lakewood":"https://www.google.com/maps/@47.1420737,-122.5166654,17z",
								"SBMC West":"https://www.google.com/maps/@47.6614945,-122.3871455,17z",
								"SBMC West Waterfront II":"https://www.google.com/maps/@47.6622389,-122.3909183,17z",
								"Sweetgrass Food Company":"https://www.google.com/maps/@47.6147766,-122.3373639,17z",
								"205 Lake Street":"https://www.google.com/maps/@47.6737748,-122.2060479,17z",
								"7525 SE 24th St":"https://www.google.com/maps/@47.5887592,-122.238603,17z",
								"1124 Sunset Ave SW; featured; 1124-sunset-ave-sw/":"https://www.google.com/maps/@47.5925886,-122.3890647,17z",
								"2017 E Spruce St (Spruce Park); featured; 2017-e-spruce-st-spruce-park/":"https://www.google.com/maps/@47.6032996,-122.3076267,17z",
								"2420 Wickstrom Pl SW; featured; 496-2/":"https://www.google.com/maps/@47.5819757,-122.4040968,17z",
								"2556 14th Ave W; featured; 2556-14th-ave-w/":"https://www.google.com/maps/@47.6424645,-122.3767536,17z",
								"3051 25th Ave W; featured; 3051-25th-ave-w-seattle-wa/":"https://www.google.com/maps/@47.6472528,-122.3910008,17z",
								"3515+3519 Wallingford Ave N; featured; 35153519-wallingford-ave-n/":"https://www.google.com/maps/@47.6498366,-122.3388867,17z",
								"511 W Kinnear Pl; featured; 511-w-kinnear-pl/":"https://www.google.com/maps/@47.6275136,-122.3660257,17z",
								"521 2nd Ave W; featured; 521-2nd-ave-w/":"https://www.google.com/maps/@47.6239628,-122.3618925,17z",
								"844 NE 69th St. [Pladhüs]; featured; 844-ne-69th-st-pladhus/":"https://www.google.com/maps/@47.6789629,-122.3200677,17z",
								"Comfort Inn – Des Moines; featured; comfort-inn-des-moines/":"https://www.google.com/maps/@47.4034167,-122.3023555,17z",
								"Des Moines Theater; featured; des-moines-theater/":"https://www.google.com/maps/@47.400996,-122.3270967,17z",
								"Fremont Design Center; featured; fremont-design-center/":"https://www.google.com/maps/@47.6526186,-122.3594861,17z",
								"Isola SW Alaska; featured; 4400-sw-alaska-st/":"https://www.google.com/maps/@47.561338,-122.3907857,17z",
								"Jupiter Apartments; featured; jupiter-apartments/":"https://www.google.com/maps/@47.6032382,-122.3126964,17z",
								"Market St Rowhouses; featured; market-st-rowhouses/":"https://www.google.com/maps/@47.6686557,-122.3645091,17z",
								"Neiderberger Craftsman; featured; neiderberger-craftsman/":"https://www.google.com/maps/@47.5876893,-122.3843389,17z",
								"Pagliacci Pizza; featured; pagliacci-pizza/":"https://www.google.com/maps/@47.5633566,-122.3892535,17z",
								"Parc West Townhouses; featured; parc-west-townhouses/":"https://www.google.com/maps/@47.6692927,-122.3570317,17z",
								"Project 728 LLC; featured; project-728-llc":"https://www.google.com/maps/@47.6261536,-122.325385,17z",
								"View Haus 5; featured; viewhaus5/":"https://www.google.com/maps/@47.620557,-122.3016867,17z",
								"Portage Bay Residence; featured; portage-bay-residence/":"https://www.google.com/maps/@47.6480868,-122.3199617,17z"
					 }'></div>
             <!-- data-pins='<?php //echo esc_attr( $pins ) ?>' -->
			</div>


			<div class="hero__overflow"></div>
		</header>
<?php
