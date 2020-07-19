(function( $ ) {
	'use strict';

	const class_initials = 'wprlbg';
	const header_height = 50;
	const slide_margin = 20;
	
	// plugin options
	let theme_style = 'dark'; // dark, light
	let caption_style = 'bottom'; // sidebar, bottom
	let show_sidebar = 1;
	let show_header = 1;

	let animation_speed = 70;
	let slideshow_speed = 3000;
	
	let window_width = 0;
	let window_height = 0;
	let previous_window_width = 0;
	let previous_window_height = 0;
	
	let older_slide = 0;
	let current_slide = 1;

	let total_items = 0;
	let $gallery_items = '';
	let gallery_name = '';

	let $body = $('body');
	let $main_container;
	let $slider;
	let $slides_to_remove = '';
	let $sidebar_wrapper;
	
	let defaults = {
		theme : 'dark',
		show_sidebar : true,
		caption_style : 'sidebar'
	};

	let resize_window = 0; // required. notifies if window was resized. prevents duplicates
	let mouse_move_timer;
	let slideshow_loop;
	let slide_show_running = 0;
	let slide_is_changing = 0; // slide change animation 
	

	// for debug
	let show_log = 1;

	let $autoplay_btn;
	let slideshow_icon_play = '<svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.5 18C4.80558 18 1 14.1944 1 9.5C1 4.80558 4.80558 1 9.5 1C14.1944 1 18 4.80558 18 9.5C18 14.1944 14.1944 18 9.5 18Z" stroke="white" stroke-width="2"/><path class="play-pause-path" d="M13.1405 9.36439L7.12909 13.1406V5.58823L13.1405 9.36439Z" fill="white"/></svg>';
	let slideshow_icon_pause = '<svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg"><path class="play-pause-path" d="M9.5 18C4.80558 18 1 14.1944 1 9.5C1 4.80558 4.80558 1 9.5 1C14.1944 1 18 4.80558 18 9.5C18 14.1944 14.1944 18 9.5 18Z" stroke="white" stroke-width="2"/><rect x="6" y="6" width="7" height="7" fill="white"/></svg>';
	

	$.fn.ohsumGallery = function(options) {

		let settings = $.extend( {}, defaults, options );

		$(this).each(function(){
			// set settings into each selector as data-attributes
			$(this)
				.attr('data-theme', settings.theme)
				.attr('data-show_sidebar', settings.show_sidebar)
				.attr('data-caption_style', settings.caption_style)
		})

		$(this).click(function(e){
			
			e.preventDefault();

			// prevent duplicates
			if( $(`#${class_initials}`).length > 0 ) return;
			
			
			// we will need gallery name later
			gallery_name = $(this).data('ohsum');

			
			// generate settings from markups
			theme_style = $(this).attr('data-theme');
			caption_style = $(this).attr('data-caption_style');
			show_sidebar = parseInt($(this).attr('data-show_sidebar'));

		
			// generate markups
			init($(this));
			
			
			// commonly used selectors
			$main_container  = $(`#${class_initials}-container`);
			$slider = $(`#${class_initials}-slider`);

			
			// open gallery modal
			$main_container.show();
			$body.css('overflow', 'hidden');
			
			
			// update window width and height
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
	// show / hide sidebar button
	// ------------------------------------------------------------------

	$body.on('click', `#${class_initials}-show-sidebar`, function(){

		// show_sidebar = ( show_sidebar ) ? 0 : 1;

		// // add class in main container
		// if( show_sidebar ){
		// 	$(`#${class_initials}`).addClass('has-sidebar');
		// }
		// else{
		// 	$(`#${class_initials}`).removeClass('has-sidebar');
		// }

		show_hide_sidebar( !show_sidebar );
		
	})


	// ------------------------------------------------------------------
	// autoplay / slideshow button
	// ------------------------------------------------------------------

	$body.on('click', `#${class_initials}-auto-play`, function(){

		$autoplay_btn = $(this);

		if( slide_show_running ){
			
			// stop slideshow
			stop_slideshow();
			
		}
		else{

			// start slideshow
			start_slideshow();
			
		}
		
			
	})


	// ------------------------------------------------------------------
	// change slide when clicked in thumbnail
	// ------------------------------------------------------------------

	$body.on('click', `.${class_initials}-thumbnail`, function(){
		
		// change older and current slide
		older_slide = current_slide;
		current_slide = $(this).data('id');

		load_slide();

	})



	// ------------------------------------------------------------------
	// close button
	// ------------------------------------------------------------------
	$body.on('click', `#${class_initials}-close`, function(){

		older_slide = 0;
		current_slide = 1;

		// close slideshow (if running)
		stop_slideshow();

		$(`#${class_initials}`).remove();
		$body.css('overflow', '');
	})


	// ------------------------------------------------------------------
	// prev button click
	// ------------------------------------------------------------------

	$body.on('click', `#${class_initials}-prev`, function(){

		if( slide_is_changing ) return;
		
		// update older and current slide number
		older_slide = current_slide;
		current_slide = get_proper_slide_number(current_slide - 1);

		load_slide();
	})


	// ------------------------------------------------------------------
	// next button click 
	// ------------------------------------------------------------------

	$body.on('click', `#${class_initials}-next`, function(){

		if( slide_is_changing ) return;

		// update older and current slide number
		older_slide = current_slide;
		current_slide = get_proper_slide_number(current_slide + 1);

		load_slide();
	})



	// ------------------------------------------------------------------
	// keyboard detection
	// ------------------------------------------------------------------


	$(`body`).keydown(function(e){

		if( slide_is_changing ) return;

		older_slide = current_slide;

		if( (e.which == 37 ||  e.which == 39) && ( $(`#${class_initials}`).length > 0 ) ){
			
			// update current slide
			if( e.which == 39 ){
				// right arrow
				current_slide = get_proper_slide_number( current_slide + 1);
			}
			else if( e.which == 37 ){
				// left arrow
				current_slide = get_proper_slide_number( current_slide - 1);
			}

			// change slide with animation
			load_slide();

		}


	});


	// ------------------------------------------------------------------
	// swipe detection
	// ------------------------------------------------------------------

	let isDragging = false;
	let mouseDown = false;
	let pageX_start = 0;
	let pageX_end = 0;
	let page_X_diff = 0;

	$body
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
				
				// $(this).scrollLeft( window_width + page_X_diff );

				$slider.css('transform', `translateX(${ (window_width * -1) + ( page_X_diff * -1) }px)` );

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
			else{
				
				// reposition slide to center
				$slider.css('transform', `translateX(${ (window_width * -1)  }px)` );

				// slide_animation('left', (window_width * -1) + ( page_X_diff * -1) );
			}

			if( please_change_slide ){

				let animation_start_point_val = page_X_diff; // (window_width * -1) + ( page_X_diff * -1); //( page_X_diff < 0 ) ? ( (window_width * 3) - 1360 + page_X_diff ) : page_X_diff;

				load_slide( animation_start_point_val  );

			}

		}
	);

	

	// -----------------------------------------------------------------------



	function init($this){

		// ------------------------------------------------------------------
		// generate required markups
		// ------------------------------------------------------------------

		let template = `<div id="${class_initials}" class="caption-in-${caption_style} ${theme_style}-theme" >`;
			template += `<div id="${class_initials}-container" class=" ${(show_sidebar) ? 'has-sidebar' : ''} ${(show_header) ? 'show-header' : ''} " >`;

			// header
			template += `<div id="${class_initials}-header">`; 
				template += `<div id="${class_initials}-counter">`; 
					template += `<span id="${class_initials}-current-items">1</span> / <span id="${class_initials}-total-items">12</span>`; 
				template += `</div>`;

				template += `<div id="${class_initials}-buttons">`; 
					template += `<button title="Auto Play" type="button" id="${class_initials}-auto-play">${slideshow_icon_play}</button>`; 
					template += `<button  title="Toggle Sidebar" type="button" id="${class_initials}-show-sidebar"><svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.5625 0H17V7.4375H9.5625V0Z" fill="white" /><path d="M0 0H7.4375V7.4375H0V0Z" fill="white"/><path d="M9.5625 9.5625H17V17H9.5625V9.5625Z" fill="white"/><path d="M0 9.5625H7.4375V17H0V9.5625Z" fill="white"/></svg></button>`; 
					template += `<button title="Previous Slide" type="button" id="${class_initials}-prev"><svg width="11" height="19" viewBox="0 0 11 19" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.37093 1.21777L1.09583 10.1912M9.37093 17.8088L1.09583 8.83535" stroke="white" stroke-width="2"/></svg></button>`; 
					template += `<button title="Next Slide" type="button" id="${class_initials}-next"><svg width="11" height="19" viewBox="0 0 11 19" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.62677 1.21777L9.90187 10.1912M1.62677 17.8088L9.90187 8.83535" stroke="white" stroke-width="2"/></svg></button>`; 
					template += `<button  title="Close" type="button" id="${class_initials}-close"><svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.6484 1.21777L9.3733 10.1912M17.6484 17.8088L9.3733 8.83535M1.62793 1.21777L9.90303 10.1912M1.62793 17.8088L9.90303 8.83535" stroke="white" stroke-width="2"/></svg></button>`; 
				template += `</div>`;
			template += `</div>`;

			// body
			template += `<div id="${class_initials}-body">`; 

				// sidebar
				template += `<div id="${class_initials}-sidebar"><div id="${class_initials}-sidebar-wrapper"></div></div>`; 

				// image-container
				template += `<div id="${class_initials}-slider-container"><ul id="${class_initials}-slider" ></ul></div>`; 

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
		$sidebar_wrapper = $(`#${class_initials}-sidebar-wrapper`);

		$gallery_items.each(function(){

			// ------------------------------------------------------------------
			// give each images a unique identifier
			// ------------------------------------------------------------------

			$(this).attr('data-ohsum_id', items_counter );


			// ------------------------------------------------------------------
			// generate thumbnail images
			// ------------------------------------------------------------------

			$sidebar_wrapper.append(`<a data-href="#${class_initials}-slide-${items_counter}" data-id="${items_counter}" id="${class_initials}-thumbnail-${items_counter}" class="${class_initials}-thumbnail" style="background-image:url(${$('img', this).attr('src')})"></a>`);
	

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


	// ------------------------------------------------------------------
	// generate correct side markups
	// switch to corrent slide with animation
	// swtich to correct thumbnail in sidebar with animation
	// ------------------------------------------------------------------

	function load_slide(scroll_left_pos = 0){

		// lock animation and slide change
		slide_is_changing = 1;

		// ------------------------------------------------------------------
		// generate slider contents
		// ------------------------------------------------------------------

		// recalculate slider width
		// calculate_slider_width();

		// update window width and height
		window_width = $(window).width();
		window_height = $(window).height();


		if( older_slide != current_slide && !resize_window ) {

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
			

			// ------------------------------------------------------------------
			// figureout if it needs to scoll left or right
			// ------------------------------------------------------------------

			if(  scroll_left_pos == 0 ){
				
				// if scroll_left_pos was not defined by other callback function
				if( current_slide - older_slide == -1  || (older_slide == 1 && current_slide == total_items ) ) {
					
					// swipe to right
					slide_animation('right', (window_width*2)*-1 );
					
				}
				else{

					// swipe to left
					slide_animation('left', 0 );
			
				}
			}
			else{

				// drag and swipe
				
				if( page_X_diff > 50  ){
					//swipe to left
					slide_animation('left', page_X_diff * -1);
				}
				else {

					// swipe to right
					slide_animation('right', ((window_width * 2)  + page_X_diff) * -1 );

				}

			}

			
		}



		// if( older_slide != current_slide && !resize_window ) {
		if( !resize_window ) {

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

					$body.trigger('image_loaded');
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


		// ------------------------------------------------------------------
		// image has been loaded
		// ------------------------------------------------------------------
		
		let $cur_slide_sel = $(`#${class_initials}-slide-${current_slide}`);
		let caption = $(`a[data-ohsum="${gallery_name}"][data-ohsum_id="${current_slide}"]`).data('caption'); 
		let $caption_sel = $cur_slide_sel.find('.caption'); 

		$body.on('image_loaded', function(){
			
			// ------------------------------------------------------------------
			// show hide captions
			// ------------------------------------------------------------------
	
	
			// remove flex class for caption height calculation
			$cur_slide_sel.removeClass('flex');
			
			if( resize_window  ){
	
				if( window_height > window_width ){
	
					// ------------------------------------------------------------------
					// portrait mode
					// ------------------------------------------------------------------
	
					// auto change caption style to bottom in potrait mode
					caption_style = 'bottom';
	
					// set width of sidebar ul wrapper
					$sidebar_wrapper.css('width', (60 * total_items) + 'px');
	
				}
				else{
	
					// ------------------------------------------------------------------
					// landscape mode
					// ------------------------------------------------------------------
	
					// unset width of sidebar wrapper in landscape mode
					$sidebar_wrapper.css('width', '');
				}
	
			}
			
			
			let caption_height = 0;
	
			// hide caption if empty
			if( caption === undefined || caption.length < 1 ){
				$caption_sel.hide();
	
				// tell css slide li item does not have caption
				$cur_slide_sel.addClass( 'no-caption' );
			}
			else{
				caption_height = $caption_sel.outerHeight();
			}
	
			// make this item flexbox to correct display positioning
			$cur_slide_sel.addClass('flex');
			
			
			if( caption_style == 'bottom'){
				
				// ------------------------------------------------------------------
				// set max height of image
				// ------------------------------------------------------------------
	
				if( window_height > window_width  ){
	
					// ------------------------------------------------------------------
					// potrait mode
					// ------------------------------------------------------------------
					
					// let sidebar_height = (show_sidebar) ?  70 : 0;
	
					// set max height of image
					// $cur_slide_sel.find('img').css('max-height', `calc(100vh - 80px - ${caption_height}px)`);
					// $cur_slide_sel.find('.caption').css('max-height', `${caption_height}px`);
				}
	
				else{
					
					// ------------------------------------------------------------------
					// landscape mode
					// ------------------------------------------------------------------
	
					// set max height of image
					$cur_slide_sel.find('img').css('max-height', `calc(100vh - ${ header_height + slide_margin + caption_height }px`);
				}
				
			}
			else{
	
				// ------------------------------------------------------------------
				// caption style is SIDEBAR
				// ------------------------------------------------------------------
	
				// match the height of caption to the height of image
				// setTimeout(function(){
				// 	// give browser some time to complete the animation and render everything properly
				// 	let cur_image_height = $cur_slide_sel.find('img').height();
				// 	$caption_sel.css('max-height', cur_image_height);
				// }, animation_speed)
			}
		
		})

		



		if( resize_window ){
			// re-position slider
			slide_animation('left', window_width*-1 );
		}

		
	}
	
	function slide_animation(direction, animation_start_point){

		let animation_complete = 0;
		const element = document.getElementById(class_initials + '-slider' ); 
		let animation_end_point = (window_width*-1); // get negative value of current width

		// remove unwanted slide
		$slides_to_remove.remove();

		if(  older_slide == 0 ){
			// do not animate
			$slider.css('transform', 'translateX(-' +  window_width + 'px)');
			
			// release slide lock
			slide_is_changing = 0;

			return;
		}

		// log('direction = ' + direction);
		// log('animation_start_point = ' + animation_start_point);
		// log('animation_end_point = ' + animation_end_point);
		// log('diff = ' + (animation_end_point - animation_start_point));
		// log('-------------------------------------------------');

		let frame_rate =  (animation_start_point + animation_end_point) / 15;

		// run animation
		window.requestAnimationFrame(step);
		function step() {
		
			if( direction == 'right' ){

				// swipe to right

				// formula for correct swipe animation
				if (animation_start_point <= animation_end_point ) { 
					
					// round figure
					if( animation_start_point - frame_rate >=  animation_end_point) animation_start_point = animation_end_point;

					// use css for hardware acceleration
					element.style.transform = 'translateX(' + animation_start_point + 'px)';

					// increase counter
					// animation_start_point += animation_speed;
					animation_start_point -= (frame_rate / 3);
					
					// call animation again
					window.requestAnimationFrame(step);
				}
				else{
					// animation complete
					animation_complete = 1;
				}

			}
			else{

				// swipe to left

				// formula for correct swipe animation
				if (animation_start_point >= animation_end_point ) { 
					
					// round figure
					if( animation_start_point + frame_rate <=  animation_end_point ) animation_start_point = animation_end_point;

					// use css for hardware acceleration
					element.style.transform = 'translateX(' + animation_start_point + 'px)';

					// decrease counter
					animation_start_point += frame_rate;
					
					// call animation again
					window.requestAnimationFrame(step);
				}
				else{
					// animation complete
					animation_complete = 1;
				}

			}

			if( animation_complete ){

				// show caption after animation is complete
				// $(`#${class_initials}-slide-${current_slide} .caption`).addClass('show-caption');
	
				// release slide lock
				slide_is_changing = 0;
			}

		}


	}

	// templates for load_slide function
	function slide_template(new_slide_id) {

		let $temp_selector = $( `a[data-ohsum="${gallery_name}"][data-ohsum_id="${new_slide_id}"]`);
		let caption = $temp_selector.attr('data-caption');
		if( caption === undefined || caption.length < 1 ) caption = '';

		let temp_slider_contents = '';
			temp_slider_contents += `<li data-id="${new_slide_id}" id="${class_initials}-slide-${new_slide_id}" >`;
			temp_slider_contents += `<div class="image loading"><img data-src="${ $temp_selector.attr('href')}" >`;
			temp_slider_contents += `<div class="caption">${caption}</div>`;				
			temp_slider_contents += `</div></li>`;

		return temp_slider_contents;

	}


	// get proper slide number
	function get_proper_slide_number(slide_number){
		if( slide_number < 1 ) return total_items;
		else if( slide_number > total_items ) return 1;
		return slide_number;
	}


	function log(msg){
		if(show_log) console.log(msg);
	}


	function stop_slideshow(){

		// ------------------------------------------------------------------
		// stop slideshow
		// ------------------------------------------------------------------

		if( !slide_show_running ) return;
		
		slide_show_running = 0;
			
		// stop slideshow
		clearInterval(slideshow_loop);

		// clear mouse move actions
		clearTimeout(mouse_move_timer);

		// show header
		show_hide_header(1);

		// show sidebar
		show_hide_sidebar(1);

		// change slideshow icon
		$autoplay_btn.html(slideshow_icon_play).attr('title', 'Auto Play');
	}


	function start_slideshow(){

		// ------------------------------------------------------------------
		// start slideshow
		// ------------------------------------------------------------------

		slide_show_running = 1;

		// hide header
		show_hide_header(0);

		// hide sidebar
		show_hide_sidebar(0);
		
		// change slideshow icon
		$autoplay_btn.html(slideshow_icon_pause).attr('title', 'Pause');;


		// start slideshow
		let slideshow_counter = 1;
		slideshow_loop = setInterval(function(){
			
			// simulate next button click
			$(`#${class_initials}-next`).click();
			slideshow_counter++;

			if( slideshow_counter == total_items ) {

				// reset counter
				slideshow_counter = 1;
				
				clearInterval(slideshow_loop);

				slide_show_running = 0;
			
				// ------------------------------------------------------------------
				// slideshow complete
				// ------------------------------------------------------------------

				// change slideshow icon
				$autoplay_btn.html(slideshow_icon_play);

				// show header
				show_hide_header(1);

				// show sidebar
				show_hide_sidebar(1);
			}

		}, slideshow_speed);


		// show header if mouse moves
		$body.on('mousemove', $main_container, function(){

			if( !slide_show_running ) return;

			// show header again
			show_hide_header(1);
			
			if (mouse_move_timer !== undefined ) {
				window.clearTimeout(mouse_move_timer);
			}
			
			mouse_move_timer = window.setTimeout(function(){
				
				// if mouse does not move for 5 second 
				// hide header again
				show_hide_header(0);
				
			}, 3000)

		})
	}


	function show_hide_header(show_or_hide){

		show_header = show_or_hide;

		if( show_header ){
			$main_container.addClass('show-header');
		}
		else{
			$main_container.removeClass('show-header');
		}
	}


	function show_hide_sidebar(show_or_hide){

		show_sidebar = show_or_hide;

		// log('current_slide = ' + current_slide);

		if( show_sidebar ){
			$main_container.addClass('has-sidebar');
			// $(`#${class_initials}-slide-${current_slide}`).addClass('flex');
		}
		else{
			$main_container.removeClass('has-sidebar');
			// $(`#${class_initials}-slide-${current_slide}`).removeClass('flex');
		}
	}


})( jQuery );


// self initialize plugin
// jQuery(document).ready(function($){
// 	$('a').ohsumGallery();
// })