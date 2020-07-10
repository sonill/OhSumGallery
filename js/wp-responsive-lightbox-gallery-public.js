(function( $ ) {
	'use strict';

	let class_initials = 'wprlbg';
	let current_slide = 1;
	let total_items = 0;
	let $gallery_items = '';
	let show_sidebar = 1;
	let caption_style = 'bottom'; // sidebar, bottom
	let theme_style = 'light'; // dark, light
	
	// ------------------------------------------------------------------
	// on document load
	// ------------------------------------------------------------------

	$(function(){

		// ------------------------------------------------------------------
		// generate basic templates
		// ------------------------------------------------------------------

		let template = `<div id="${class_initials}" class="${class_initials}-wrapper ${(show_sidebar) ? 'has-sidebar' : ''} caption-in-${caption_style} ${theme_style}-theme">`;
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

		$gallery_items = $('.gallery-item');
		total_items = $gallery_items.length;
		let items_counter = 1;
		$gallery_items.each(function(){

			// ------------------------------------------------------------------
			// generate thumbnail images
			// ------------------------------------------------------------------

			$(`#${class_initials}-sidebar-wrapper`).append(`<a data-href="#${class_initials}-slide-${items_counter}" data-id="${items_counter}" id="${class_initials}-thumbnail-${items_counter}" class="${class_initials}-thumbnail" style="background-image:url(${$('img', this).attr('src')})"></a>`);
	


			// ------------------------------------------------------------------
			// generate main slider contents
			// ------------------------------------------------------------------

			let caption = $('.gallery-caption', this).text();
			let slider_contents = `<li id="${class_initials}-slide-${items_counter}" ><div class="image loading"><img data-src="${$('a', this).attr('href')}" >`;
				// if( caption.length > 0 ){
					slider_contents += `<div class="caption">${caption}</div>`;				
				// }
			slider_contents += `</div></li>`;

			$(`#${class_initials}-slider`).append(slider_contents);



			// ------------------------------------------------------------------
			// increase total items counter
			// ------------------------------------------------------------------

			items_counter++;

		})



		// ------------------------------------------------------------------
		// update total number of slides in header
		// ------------------------------------------------------------------
		$(`#${class_initials}-total-items`).text(total_items);



		// ------------------------------------------------------------------
		// calculate width of slider list items
		// ------------------------------------------------------------------
		calculate_slider_width();

		

		// ------------------------------------------------------------------
		// resize window
		// ------------------------------------------------------------------

		$(window).resize(function(){
			// update dom
			
			calculate_slider_width();

			// change_slide() should be called after calculate_slider_width() function
			change_slide();

		})



		// ------------------------------------------------------------------
		// mark first image as defaults 
		// ------------------------------------------------------------------
		change_slide();

		// thumbnail
		$(`#${class_initials}-thumbnail-1`).addClass('active');



		// ------------------------------------------------------------------
		// show / hide sidebar button
		// ------------------------------------------------------------------

		$(`#${class_initials}-show-sidebar`).click(function(){

			show_sidebar = ( show_sidebar ) ? 0 : 1;

			// add class in main container
			if( show_sidebar ){
				$(`#${class_initials}`).addClass('has-sidebar');
			}
			else{
				$(`#${class_initials}`).removeClass('has-sidebar');
			}
			
			calculate_slider_width();

			change_slide();
		})



		// ------------------------------------------------------------------
		// disable buttons after click
		// ------------------------------------------------------------------
		$(`#${class_initials}-buttons button`).click(function(){

			// disable button 
			$(this).prop('disabled', true);
			
		})


		// ------------------------------------------------------------------
		// next button click 
		// ------------------------------------------------------------------

		$(`#${class_initials}-next`).click(function(){
			
			current_slide++;
			if( current_slide > total_items) current_slide = 1;
			change_slide();

		})



		// ------------------------------------------------------------------
		// prev button click
		// ------------------------------------------------------------------

		$(`#${class_initials}-prev`).click(function(){
			current_slide--;
			if( current_slide < 1) current_slide = total_items;
			change_slide();
		})



		// ------------------------------------------------------------------
		// change slide when clicked in thumbnail
		// ------------------------------------------------------------------

		$(`.${class_initials}-thumbnail`).click(function(){
			current_slide = $(this).data('id');
			change_slide();
		})



		// ------------------------------------------------------------------
		// keyboard detection
		// ------------------------------------------------------------------
		$(`body`).keydown(function(e){

			// update current slide
			if( e.which == 39 ){
				// right arrow
				current_slide++;
				if( current_slide > total_items) current_slide = 1;
			}
			else if( e.which == 37  ){
				// left arrow
				current_slide--;
				if( current_slide < 1) current_slide = total_items;
			}

			// change slide with animation
			change_slide();

		});



		// ------------------------------------------------------------------
		// swipe detection
		// ------------------------------------------------------------------

		let isDragging = false;
		let mouseDown = false;
		let pageX_start = 0;
		let pageX_end = 0;
		let cur_slide_position = 0;
		let page_X_diff = 0;

		$(`#${class_initials}-slider-container`)
		    .on('mousedown touchstart', function(e) {

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

		        cur_slide_position = document.getElementById(class_initials + '-slide-' + current_slide).offsetLeft;

		    })
		    .on('mousemove touchmove', function(e) {
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

					$(this).scrollLeft(cur_slide_position + page_X_diff);
		        }
		     })
		    .on('mouseup touchend', function(e) {

		        isDragging = false;
		        mouseDown = false;

				// update current slide
				if( page_X_diff > 50  ){
					current_slide++;
					if( current_slide > total_items) current_slide = 1;
				}
				else if( page_X_diff < -50  ){
					current_slide--;
					if( current_slide < 1) current_slide = total_items;
				}

				// change slide with animation
				change_slide();
		    }
		);

	}) // on load function


	function change_slide(){

		// ------------------------------------------------------------------
		// scroll to correct slide with animation
		// ------------------------------------------------------------------

		$(`#${class_initials}-slider-container`).animate({
			scrollLeft : document.getElementById(class_initials + '-slide-' + current_slide).offsetLeft
		}, 600,  function(){
			// enable button
			$(`#${class_initials}-buttons button`).prop('disabled', false);
		})


		// ------------------------------------------------------------------
		// lazy loading images in main slider
		// ------------------------------------------------------------------

		// select images which are not already loaded
		let $current_slide_img = $(`#${class_initials}-slide-${current_slide} img:not(.loaded)`);
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
		// auto scroll sidebar thumbnails
		// ------------------------------------------------------------------

		if( $(window).height() > $(window).width() ){
			
			// ------------------------------------------------------------------
			// potrait mode
			// ------------------------------------------------------------------
			
			// slide to left
			$(`#${class_initials}-sidebar`).animate({
				scrollLeft: document.getElementById(class_initials + '-thumbnail-' + current_slide).offsetLeft - 150
			}, 500);
			
		}
		else{
			
			// ------------------------------------------------------------------
			// landscape mode
			// ------------------------------------------------------------------
			
			let thumbnail_offset = 75;

			// slide to top
			$(`#${class_initials}-sidebar`).animate({
				scrollTop: ((current_slide-1) * thumbnail_offset) - 150
			}, 500);

		}


		// ------------------------------------------------------------------
		// update slide number in heading
		// ------------------------------------------------------------------

		$(`#${class_initials}-current-items`).text(current_slide);

	} // change slide


	function calculate_slider_width(){

		// ------------------------------------------------------------------
		// calculate width of slider list items
		// ------------------------------------------------------------------

		let window_width = $(window).width();
		let window_height = $(window).height();

		if(window_width < 1200){

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

		$(`#${class_initials}-slider`).width(total_items * window_width);



		// ------------------------------------------------------------------
		// set width of slider li
		// ------------------------------------------------------------------

		$(`#${class_initials}-slider li`).css('width', window_width);


		
		// ------------------------------------------------------------------
		// set width of each .image div
		// ------------------------------------------------------------------

		$gallery_items.each(function(index){
			
			let $cur_caption = $(`#${class_initials}-slide-${index+1} .caption`);

			// hide caption if empty
			if( $cur_caption.text().length < 1 ){
				$cur_caption.hide();
			}


			if( caption_style == 'bottom'){
				
				// ------------------------------------------------------------------
				// set max height of image
				// ------------------------------------------------------------------
				
				if( window_width < 768 ){
					// mobile devices or other smaller screen
	
					// set max height of image
					$(`#${class_initials}-slide-${index+1} img`).css('max-height', `calc(100vh - 80px - ${$cur_caption.outerHeight(true)}px)`);
				}

				else if( window_width >= 768 ){
					// all other screen sizes
	
					// set max height of image
					$(`#${class_initials}-slide-${index+1} img`).css('max-height', `calc(100vh - 100px - ${$cur_caption.outerHeight(true)}px)`);
				}
				
			}

		}) // foreach
	} // calculate_slider_width

})( jQuery );