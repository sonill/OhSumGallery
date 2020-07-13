(function( $ ) {
	'use strict';

	const class_initials = 'wprlbg';
	const animation_speed = 600;
	const header_height = 50;
	const slide_margin = 20;
	
	// plugin options
	const theme_style = 'dark'; // dark, light
	let caption_style = 'sidebar'; // sidebar, bottom
	let show_header = 1;
	let show_sidebar = 1;

	let window_width = 0;
	let window_height = 0;
	let previous_window_width = 0;
	let previous_window_height = 0;

	let older_slide = 0;
	let current_slide = 1;
	let total_items = 0;
	let $gallery_items = '';
	let gallery_name = '';
	
	let settings =  '';
	let resize_window = 0;

	// for debug
	let show_log = 1;

	
	$.fn.ohsumGallery = function(options) {

		// This is the easiest way to have default options.
        // settings = $.extend({
        //     color: "#556b2f",
        //     backgroundColor: "white"
		// }, options );

		
		$(this).click(function(e){

			e.preventDefault();
			
			gallery_name = $(this).data('ohsum');
		
			// generate markups
			init($(this));

			
			// open gallery modal
			show_gallery_modal();


			window_width = $(window).width();
			window_height = $(window).height();

			// load and switch to correct slide
			load_slide();
			
		})

		
	} // end plugin main function


	// ------------------------------------------------------------------
	// resize window
	// ------------------------------------------------------------------

	$(window).resize(function(){
		
		resize_window = 1;

		// load slide again
		load_slide();

		resize_window = 0;

	})	


	// ------------------------------------------------------------------
	// change slide when clicked in thumbnail
	// ------------------------------------------------------------------

	$('body').on('click', `.${class_initials}-thumbnail`, function(){
		
		// change older and current slide
		older_slide = current_slide;
		current_slide = $(this).data('id');

		load_slide();

	})



	// ------------------------------------------------------------------
	// close button
	// ------------------------------------------------------------------
	$('body').on('click', `#${class_initials}-close`, function(){
		close_gallery_modal();
	})


	// ------------------------------------------------------------------
	// disable buttons after click
	// ------------------------------------------------------------------
	$('body').on('click', `#${class_initials}-buttons button:not(#wprlbg-show-sidebar)`, function(){

		// disable button 
		$(this).prop('disabled', true);
		
	})


	// ------------------------------------------------------------------
	// prev button click
	// ------------------------------------------------------------------

	$('body').on('click', `#${class_initials}-prev`, function(){
		
		// update older and current slide number
		older_slide = current_slide;
		current_slide = get_proper_slide_number(current_slide - 1);

		load_slide();
	})


	// ------------------------------------------------------------------
	// next button click 
	// ------------------------------------------------------------------

	$('body').on('click', `#${class_initials}-next`, function(){
		
		// update older and current slide number
		older_slide = current_slide;
		current_slide = get_proper_slide_number(current_slide + 1);

		load_slide();
	})


	// ------------------------------------------------------------------
	// show / hide sidebar button
	// ------------------------------------------------------------------

	$('body').on('click', `#${class_initials}-show-sidebar`, function(){

		show_sidebar = ( show_sidebar ) ? 0 : 1;

		// add class in main container
		if( show_sidebar ){
			$(`#${class_initials}`).addClass('has-sidebar');
		}
		else{
			$(`#${class_initials}`).removeClass('has-sidebar');
		}
		
		calculate_slider_width();
	})


	// ------------------------------------------------------------------
	// keyboard detection
	// ------------------------------------------------------------------


	$(`body`).keydown(function(e){

		older_slide = current_slide;

		// update current slide
		if( e.which == 39 && $(`#${class_initials}`).length > 0 ){
			// right arrow
			current_slide = get_proper_slide_number( current_slide + 1);
		}
		else if( e.which == 37  && $(`#${class_initials}`).length > 0 ){
			// left arrow
			current_slide = get_proper_slide_number( current_slide - 1);
		}

		// change slide with animation
		load_slide();

	});


	// ------------------------------------------------------------------
	// swipe detection
	// ------------------------------------------------------------------

	let isDragging = false;
	let mouseDown = false;
	let pageX_start = 0;
	let pageX_end = 0;
	let page_X_diff = 0;

	$('body')
		.on('mousedown touchstart', `#${class_initials}-slider-container`, function(e) {

			isDragging = false;
			mouseDown = true;
			page_X_diff = 0;
			
			if( e.pageX !== undefined){
				// mouse
				pageX_start = e.pageX;
			}
			else{
				// touch
				pageX_start = e.originalEvent.changedTouches[0].screenX;
			}

			// ------------------------------------------------------------------
			// get current slide offset
			// using raw javascript becuase jQuery was not returning correct values
			// ------------------------------------------------------------------

		})
		.on('mousemove touchmove', `#${class_initials}-slider-container`, function(e) {
			isDragging = true;

			if (isDragging === true && mouseDown === true) {

				// ------------------------------------------------------------------
				// update drag values
				// ------------------------------------------------------------------

				if( e.pageX !== undefined){
					// mouse
					pageX_end = e.pageX;
				}
				else{
					// touch
					pageX_end = e.originalEvent.changedTouches[0].screenX;
				}

				page_X_diff = pageX_start - pageX_end;

				
				// ------------------------------------------------------------------
				// scroll page right or left programatically
				// ------------------------------------------------------------------
				
				$(this).scrollLeft( window_width + page_X_diff );

			}
		})
		.on('mouseup touchend', `#${class_initials}-slider-container`, function(e) {

			isDragging = false;
			mouseDown = false;

			let please_change_slide = 0;
			
			// update current slide
			if( page_X_diff > 50  ){
				older_slide = current_slide;
				current_slide = get_proper_slide_number(current_slide + 1);
				please_change_slide = 1;
			}
			else if( page_X_diff < -50  ){
				older_slide = current_slide;
				current_slide = get_proper_slide_number(current_slide - 1);
				please_change_slide = 1;
			}

			if( please_change_slide ){

				let slide_offset_val = ( page_X_diff < 0 ) ? ( (window_width * 3) - 1360 + page_X_diff ) : page_X_diff;

				load_slide( slide_offset_val  );

			}

		}
	);

	
	// -----------------------------------------------------------------------


	function init($this){

		// ------------------------------------------------------------------
		// generate required markups
		// ------------------------------------------------------------------

		let template = `<div id="${class_initials}" class="${class_initials}-wrapper ${(show_sidebar) ? 'has-sidebar' : ''} ${(show_header) ? 'show-header' : ''} caption-in-${caption_style} ${theme_style}-theme">`;
			template += `<div id="${class_initials}-container">`;

			// header
			template += `<div id="${class_initials}-header">`; 
				template += `<div id="${class_initials}-counter">`; 
					template += `<span id="${class_initials}-current-items">1</span> / <span id="${class_initials}-total-items">12</span>`; 
				template += `</div>`;

				template += `<div id="${class_initials}-buttons">`; 
					template += `<button type="button" id="${class_initials}-show-sidebar"><svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.5625 0H17V7.4375H9.5625V0Z" fill="white" /><path d="M0 0H7.4375V7.4375H0V0Z" fill="white"/><path d="M9.5625 9.5625H17V17H9.5625V9.5625Z" fill="white"/><path d="M0 9.5625H7.4375V17H0V9.5625Z" fill="white"/></svg></button>`; 
					template += `<button type="button" id="${class_initials}-prev"><svg width="11" height="19" viewBox="0 0 11 19" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.37093 1.21777L1.09583 10.1912M9.37093 17.8088L1.09583 8.83535" stroke="white" stroke-width="2"/></svg></button>`; 
					template += `<button type="button" id="${class_initials}-next"><svg width="11" height="19" viewBox="0 0 11 19" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.62677 1.21777L9.90187 10.1912M1.62677 17.8088L9.90187 8.83535" stroke="white" stroke-width="2"/></svg></button>`; 
					template += `<button type="button" id="${class_initials}-close"><svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.6484 1.21777L9.3733 10.1912M17.6484 17.8088L9.3733 8.83535M1.62793 1.21777L9.90303 10.1912M1.62793 17.8088L9.90303 8.83535" stroke="white" stroke-width="2"/></svg></button>`; 
				template += `</div>`;
			template += `</div>`;

			// body
			template += `<div id="${class_initials}-body">`; 

				// sidebar
				template += `<div id="${class_initials}-sidebar"><div id="${class_initials}-sidebar-wrapper"></div></div>`; 

				// image-container
				template += `<div id="${class_initials}-slider-container"><ul id="${class_initials}-slider"></ul></div>`; 

			template += `</div>`;
			template += `</div</div>`;
			
		// append to body
		$("body").append(template);


		// ------------------------------------------------------------------
		// prepare gallery item markups
		// ------------------------------------------------------------------

		let items_counter = 1;
		$gallery_items = $(`a[data-ohsum="${gallery_name}"]`);
		total_items = $gallery_items.length;

		$gallery_items.each(function(){

			// ------------------------------------------------------------------
			// give each images a unique identifier
			// ------------------------------------------------------------------

			$(this).attr('data-ohsum_id', items_counter );



			// ------------------------------------------------------------------
			// generate thumbnail images
			// ------------------------------------------------------------------

			$(`#${class_initials}-sidebar-wrapper`).append(`<a data-href="#${class_initials}-slide-${items_counter}" data-id="${items_counter}" id="${class_initials}-thumbnail-${items_counter}" class="${class_initials}-thumbnail" style="background-image:url(${$('img', this).attr('src')})"></a>`);
	

			// ------------------------------------------------------------------
			// increase total items counter
			// ------------------------------------------------------------------

			items_counter++;

		}) // end each loop


		// change older and current slide
		current_slide = $this.data('ohsum_id');


		// ------------------------------------------------------------------
		// update total number of slides in header
		// ------------------------------------------------------------------
		$(`#${class_initials}-total-items`).text(total_items);

	}

	function show_gallery_modal(){
		
		$(`${class_initials}`).show();
		$('body').css('overflow', 'hidden');
	}


	function close_gallery_modal(){
		$(`#${class_initials}`).remove();
		$('body').css('overflow', '');
	}


	function load_slide(scroll_left_pos = 0){


		// ------------------------------------------------------------------
		// generate slider contents
		// ------------------------------------------------------------------

		let $slides_to_remove = '';

		if( older_slide != current_slide && !resize_window ) {

			// make all caption invisible
			$(`#${class_initials}-slider .caption`).removeClass('show-caption');

				
			// ------------------------------------------------------------------
			// figure out if requested slide is neighbour to active slide
			// ------------------------------------------------------------------

			if( older_slide != 0 &&  ( current_slide - older_slide == 1  || (older_slide == total_items && current_slide == 1 )  ) ){

				// ------------------------------------------------------------------
				// same as right arrow click
				// ------------------------------------------------------------------
				
				$slides_to_remove = $(`#${class_initials}-slider li`).first();
				$(`#${class_initials}-slider`).append(slide_template( get_proper_slide_number( $(`#${class_initials}-slider li`).last().data('id') + 1 ) ));

			}
			else if( older_slide != 0 && ( current_slide - older_slide == -1  || (older_slide == 1 && current_slide == total_items )  ) ){

				// ------------------------------------------------------------------
				// same as left arrow click
				// ------------------------------------------------------------------

				$slides_to_remove = $(`#${class_initials}-slider li`).last();
				$(`#${class_initials}-slider`).prepend(slide_template( get_proper_slide_number( $(`#${class_initials}-slider li`).first().data('id') - 1 ) ));

			}
			else{

				$slides_to_remove = $(`#${class_initials}-slider li`);

				// ------------------------------------------------------------------
				// generate totally new slides
				// ------------------------------------------------------------------

				let slider_contents = '';

				for( let i = -1; i <= 1; i++ ){
					slider_contents += slide_template( get_proper_slide_number(  current_slide + i ) );
				}

				$(`#${class_initials}-slider`).append(slider_contents);

			}

			// remove unwanted slides
			$slides_to_remove.remove();
			
		}
		


		// recalculate slider width
		calculate_slider_width();


		// ------------------------------------------------------------------
		// figureout if it needs to scoll left or right
		// ------------------------------------------------------------------

		if(  scroll_left_pos == 0 ){
			
			// if scroll_left_pos was not defined by other callback function
			if( current_slide - older_slide == -1  || (older_slide == 1 && current_slide == total_items ) ) {
				// slide smoothly from left 
				scroll_left_pos = window_width * 3;
			}
		}


		// slide to correct slide with animation
		$(`#${class_initials}-slider-container`)
			.scrollLeft( scroll_left_pos )
			.animate({
				scrollLeft : window_width
			}, animation_speed,  function(){

				// bydefault, caption is invisible
				// make it visible

				$(`#${class_initials}-slide-${current_slide} .caption`).addClass('show-caption');

			// ------------------------------------------------------------------
			// enable button
			// ------------------------------------------------------------------

			$(`#${class_initials}-buttons button`).prop('disabled', false);

		})


		if( older_slide != current_slide && !resize_window ) {

			// ------------------------------------------------------------------
			// lazy loading images in main slider
			// ------------------------------------------------------------------

			// select images which are not already loaded
			let $current_slide_img = $(`#${class_initials}-slide-${current_slide} img:not(.loaded`);
			let large_image = $current_slide_img.attr('data-src');

			$current_slide_img
				.attr('src', large_image)
				.removeAttr('data-src')
				.load(function(){

					// mark image as loaded
					$(this).addClass('loaded');
					
					let $parent = $(this).parents('.image');			
					$parent.removeClass('loading');
				})


			// ------------------------------------------------------------------
			// change active thumbnail in sidebar
			// ------------------------------------------------------------------
			$(`.${class_initials}-thumbnail`).removeClass('active');
			$(`#${class_initials}-thumbnail-${current_slide}`).addClass('active');

			// ------------------------------------------------------------------
			// update slide number in heading
			// ------------------------------------------------------------------

			$(`#${class_initials}-current-items`).text(current_slide);

		}

		// ------------------------------------------------------------------
		// auto scroll sidebar thumbnails
		// ------------------------------------------------------------------

		if( $(window).height() > $(window).width() ){
			
			// ------------------------------------------------------------------
			// potrait mode
			// ------------------------------------------------------------------
			
			// slide to left
			$(`#${class_initials}-sidebar`).animate({
				scrollLeft: document.getElementById(class_initials + '-thumbnail-' + current_slide).offsetLeft - 150
			}, animation_speed);
			
		}
		else{
			
			// ------------------------------------------------------------------
			// landscape mode
			// ------------------------------------------------------------------
			
			let thumbnail_offset = 75;

			// slide to top
			$(`#${class_initials}-sidebar`).animate({
				scrollTop: ((current_slide-1) * thumbnail_offset) - 150
			}, animation_speed);

		}

	}



	function slide_template(new_slide_id) {

		let $temp_selector = $( `a[data-ohsum="${gallery_name}"][data-ohsum_id="${new_slide_id}"]`);
		let caption = $temp_selector.attr('data-caption');
		if( caption === undefined || caption.length < 1 ) caption = '';

		let temp_slider_contents = '';
			temp_slider_contents += `<li data-id="${new_slide_id}" id="${class_initials}-slide-${new_slide_id}" style="width:${window_width}px;" >`;
			temp_slider_contents += `<div class="image loading"><img data-src="${ $temp_selector.attr('href')}" >`;
			temp_slider_contents += `<div class="caption">${caption}</div>`;				
			temp_slider_contents += `</div></li>`;

		return temp_slider_contents;

	}



	function calculate_slider_width(manual_total_items = 3){

		// ------------------------------------------------------------------
		// calculate width of slider list items
		// ------------------------------------------------------------------

		// new window width and height
		window_width = $(window).width();
		window_height = $(window).height();


		let resized = 0;
		if(  previous_window_height != window_height || previous_window_width != window_width ){
			resized = 1;
		}

		// update previous window width and height
		previous_window_width = window_width;
		previous_window_height = window_height;

		
		if( resized  ){

			if( window_width < 1200){
				// auto change caption style in smaller devices
				caption_style = 'bottom';
			}


			if( window_height > window_width ){

				// ------------------------------------------------------------------
				// portrait mode
				// ------------------------------------------------------------------

				let thumbnail_width = 60;
				
				// set width of sidebar ul wrapper
				$(`#${class_initials}-sidebar-wrapper`).css('width', (thumbnail_width * total_items) + 'px');

			}
			else{
				// ------------------------------------------------------------------
				// landscape mode
				// ------------------------------------------------------------------

				// unset width of sidebar wrapper in landscape mode
				$(`#${class_initials}-sidebar-wrapper`).css('width', '');
			}


			// ------------------------------------------------------------------
			// set width of slider ul
			// ------------------------------------------------------------------
	
			$(`#${class_initials}-slider`).width( manual_total_items * window_width);
	

			// ------------------------------------------------------------------
			// update width of slider li
			// ------------------------------------------------------------------

			$(`#${class_initials}-slider li`).css('width', window_width);
		

		}


		
		// ------------------------------------------------------------------
		// set width of each .image div
		// ------------------------------------------------------------------

		let $cur_slide_sel = $(`#${class_initials}-slide-${current_slide}`);
		let caption = $(`a[data-ohsum="${gallery_name}"][data-ohsum_id="${current_slide}"]`).data('caption'); 
		let $caption_sel = $cur_slide_sel.find('.caption'); // $(`#${class_initials}-slide-${current_slide} .caption`);
		let caption_height = 0;

		
		// hide caption if empty
		if( caption === undefined || caption.length < 1 ){
			$caption_sel.hide();

			// tell css slide li item does not have caption
			$cur_slide_sel.addClass( 'no-caption' );
		}
		else{
			caption_height = $caption_sel.outerHeight(true);
		}
		

		if( caption_style == 'bottom'){
			
			// ------------------------------------------------------------------
			// set max height of image
			// ------------------------------------------------------------------
			
			if( window_width < 768 ){
				// mobile devices or other smaller screen

				// set max height of image
				$cur_slide_sel.find('img').css('max-height', `calc(100vh - 80px - ${caption_height}px)`);
			}

			else if( window_width >= 768 ){
				// all other screen sizes

				// set max height of image
				$cur_slide_sel.find('img').css('max-height', `calc(100vh - ${header_height + slide_margin}px - ${caption_height}px)`);
			}
			
		}
		

	} // calculate_slider_width


	function get_proper_slide_number(slide_number){
		if( slide_number < 1 ) return total_items;
		else if( slide_number > total_items ) return 1;
		return slide_number;
	}

	function log(msg){
		if(show_log) console.log(msg);
	}

})( jQuery );


// self initialize plugin
jQuery(document).ready(function($){

	$('a').ohsumGallery();
})
