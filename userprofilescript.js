$(document).ready(function(){
    $('#menu').click(function(){
        $(this).toggleClass('fa-times');
        $('header').toggleClass('toggle');
    });

    $(window).on('scroll load', function(){
        $('#menu').removeClass('fa-times');
        $('header').removeClass('toggle');

        if($(window).scrollTop() > 0){
            $('.top').show();
        }else{
            $('.top').hide();

        }
    });

    // smooth scrolling

    $('a[href*="#"]').on('click', function(e){

        e.preventDefault();

        $('html, body').animate({
            scrollTop : $($(this).attr('href')).offset().top,
        },
            500,
            'linear'

        );

    });

});


document.addEventListener("DOMContentLoaded", function () {
    var description = document.querySelector('#Description');
    var phoneNum = document.querySelector('#PhoneNum');
    var location = document.querySelector('#Location');

    // Update About section
    document.querySelector('#Desc').textContent = description.value;

    // Update Previous Volunteering Experience section
    var prevVolExpContent = '';
    var prevVolExpBoxes = document.querySelectorAll('.box');
    prevVolExpBoxes.forEach(function (box) {
        var company = box.querySelector('.company-input').value;
        var description = box.querySelector('.description-input').value;
        var hoursWorked = box.querySelector('.hours-input').value;

        prevVolExpContent += '<div class="box">';
        prevVolExpContent += '<i class="fa-solid fa-utensils"></i>';
        prevVolExpContent += '<span>Date - Date</span>'; // Replace Date with actual date
        prevVolExpContent += '<h3>' + company + '</h3>'; // Use actual company value
        prevVolExpContent += '<p>Description: ' + description + '</p>'; // Use actual description value
        prevVolExpContent += '<p>Hours Worked: ' + hoursWorked + '</p>'; // Use actual hours worked value
        prevVolExpContent += '</div>';
    });

    document.querySelector('#userPrevVolExp').innerHTML = prevVolExpContent;

    // Update Contact section
    var contactContent = '';
    contactContent += '<h1 class="heading"> my <span>contact</span> info </h1>';
    contactContent += '<div class="row">';
    contactContent += '<div class="content">';
    contactContent += '<h3 class="title">contact info</h3>';
    contactContent += '<div class="info">';
    contactContent += '<h3><i class="fas fa-envelope"></i> email@gmail.com</h3>';
    contactContent += '<h3><i class="fas fa-phone"></i> ' + phoneNum.value + '</h3>'; // Use actual phone number value
    contactContent += '<h3><i class="fas fa-map-marker-alt"></i> ' + location.value + '</h3>'; // Use actual location value
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
