  $(document).ready(function(){

    $('#menu').click(function(){
        $(this).toggleClass('fa-times');
        $('header').toggleClass('toggle');
    });

    $(window).on('scroll load', function(){
        $('#menu').removeClass('fa-times');
        $('header').removeClass('toggle');
    });

    $('a[href*="#"]').on('click',function(e){
        e.preventDefault();
        $('html, body').animate({
            scrollTop : $($(this).attr('href')).offset().top,

        }, 
            400,
            'linear'
        );
    });


  });


  document.addEventListener("DOMContentLoaded", function () {
    var description = document.querySelector('#Description');
    var phoneNum = document.querySelector('#PhoneNum');
    var location = document.querySelector('#Location');


    document.querySelector('#Desc').textContent = description.value;

    var currentOppContent = '';
    var currentOppBoxes = document.querySelectorAll('.box');
    currentOppBoxes.forEach(function (box) {
        var opportunities = box.querySelector('.opportunity-input').value;
        var description = box.querySelector('.description-input').value;

        currentOppContent += '<div class="box">';
        currentOppContent += '<i class="fa-solid fa-utensils"></i>';
        currentOppContent += '<span>Date - Date</span>'; 
        currentOppContent += '<h3>' + opportunities + '</h3>'; 
        currentOppContent += '<p>Description: ' + description + '</p>'; 
        currentOppContent += '<button class="btn1">Read More</button>'
        currentOppContent += '</div>';
    });

    document.querySelector('#currentOpps').innerHTML = currentOppContent;

    var previousOppContent = '';
    var previousOppBoxes = document.querySelectorAll('.previous-box');
    previousOppBoxes.forEach(function (box) {
    previousOppContent += '<div class="box">';
    previousOppContent += '<label for="previousOpportunity">Previous Opportunity:</label>';
    previousOppContent += '<input type="file" id="previousOpportunity" name="previousOpportunity">';
    previousOppContent += '<button class="btn1">Read More</button>';
    previousOppContent += '</div>';
    });

    document.querySelector('#PreviousOpps').innerHTML = previousOppContent;

    var photosContent = '';
    var photosBoxes = document.querySelectorAll('.photos-box');
    photosBoxes.forEach(function (box) {
        photosContent += '<div class="photos-box">';
        photosContent += '<label for="photo">Photo:</label>';
        photosContent += '<input type="file" id="photo" name="photo">';
        photosContent += '</div>';
    });

    document.querySelector('#photos').innerHTML = photosContent;


    var contactContent = '';
    contactContent += '<h1 class="heading"> my <span>contact</span> info </h1>';
    contactContent += '<div class="row">';
    contactContent += '<div class="content">';
    contactContent += '<h3 class="title">contact info</h3>';
    contactContent += '<div class="info">';
    contactContent += '<h3><i class="fas fa-envelope"></i> email@gmail.com</h3>';
    contactContent += '<h3><i class="fas fa-phone"></i> ' + phoneNum.value + '</h3>'; 
    contactContent += '<h3><i class="fas fa-map-marker-alt"></i> ' + location.value + '</h3>'; 
    contactContent += '</div>';
    contactContent += '</div>';
    contactContent += '<form action="">';
    contactContent += '<input type="text" placeholder="name" class="box">';
    contactContent += '<input type="email" placeholder="email" class="box">';
    contactContent += '<input type="text" placeholder="project" class="box">';
    contactContent += '<textarea name="" id="" cols="30" rows="10" class="box message" placeholder="message"></textarea>';
    contactContent += '<button type="submit" class="btn"> send <i class="fas fa-paper-plane"></i></button>';
    contactContent += '</form>';
    contactContent += '</div>';

    document.querySelector('#userContactInfo').innerHTML = contactContent;

    
});








