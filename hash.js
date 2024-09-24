/*
 * Hash  v0.7.1
 * Copyright 2023 HashHackCode, LLP.
 */
(function($) {
function Hash(config) {
    this.config = config;
    this.clickedDotsSequence = []; 
    this.initialStates = {};
    this.init();
}

Hash.prototype.init = function() {
    var _this = this;
    var lastClickedRef = null;
    var lastClickedRefTileClass = null;
    var lastClickedRefTileColorClass = null;
    var lastClickedRefOptionClass = null;
    var lastDotIndex = 0;


    $(document).ready(function($) {
        //BG JS
        if ($('.pageGrid').hasClass('bg')) {
            var bgImage = $('.question.active').data('bg');
            $('.pageGrid.bg').css('background-image', 'url(' + bgImage + ')');

            $('.question').on('classChanged', function() {
                var bgImage = $('.question.active').data('bg');
                $('.pageGrid.bg').css('background-image', 'url(' + bgImage + ')');
            });
        }
        //End of BG JS
    // Initialize worksheet results object
    // TO DO - auto assign the worksheet id from post
    $('section.worksheet').each(function() {
        var totalQuestions = $(this).find('.question').length;
    
        // Hide all questions initially and show only the first one
        $(this).find('.question').each(function() {
            var questionClass = $(this).attr('class').split(' ').find(c => c.startsWith('q'));
            _this.initialStates[questionClass] = $(this).html(); // Store initial HTML for resetting questions
            $(this).hide(); // Hide all questions initially
        });
        var $firstQuestion = $(this).find('.question').first();
        $firstQuestion.show(); // Show only the first question
        $firstQuestion.addClass('active'); // Mark the first question as active

        _this.updateQuestionDisplay($firstQuestion, totalQuestions, false); // Update the question display after marking the first question as active
    
    });
    

    function getClassStartingWith(element, prefix) {
        return $(element).attr('class').split(' ').find(c => c.startsWith(prefix));
    }
    //JS Change 1
    $('section.worksheet').on('click', '.ans-select, .ans-image, .ans-fill, .ans-ref, .ans-multi', function() {
        if ($(this).hasClass('ans-multi')) {
            $(this).toggleClass('selected');
        } else {
            $(this).siblings().removeClass('selected').end().addClass('selected');
        }
    });
    // End of JS Change 1
    $('section.worksheet').on('click', '.ans-ref', function() {
        var questionType = $(this).closest('.question').data('question');
    
        switch (questionType) {
    
            case 'tiles':
                lastClickedRef = $(this);
                lastClickedRefTileClass = getClassStartingWith(this, 'tile-');
                lastClickedRefTileColorClass = getClassStartingWith(this, 'tileColor-');                    
                break;
    
            case 'options':
                lastClickedRef = $(this);
                lastClickedRefOptionClass = getClassStartingWith(this, 'option-');
                break;
    
            // ... other cases for different question types ...
        }
    });
    
    $('section.worksheet').on('click', '.ans-tiles', function(event) {
        event.stopPropagation();
        var currentTileClass = getClassStartingWith(this, 'tile-');
        var currentTileColorClass = getClassStartingWith(this, 'tileColor-');
    
        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected').removeClass(currentTileClass).removeClass(currentTileColorClass);
            $('.ans-ref.' + currentTileClass).show();
        } else if (lastClickedRef) {
            $('.ans-tiles.selected.' + lastClickedRefTileClass).removeClass('selected').removeClass(lastClickedRefTileClass).removeClass(lastClickedRefTileColorClass);
            $(this).addClass(lastClickedRefTileClass).addClass(lastClickedRefTileColorClass).addClass('selected');
            lastClickedRef.hide();
            lastClickedRef = null;
            lastClickedRefTileClass = null;
            lastClickedRefTileColorClass = null;
        }
    });
    
    $('section.worksheet').on('click', '.ans-options', function(event) {
        event.stopPropagation();   
        if (lastClickedRef) {
            var currentOptionClass = getClassStartingWith(this, 'option-');
            if (currentOptionClass) {
                $(this).removeClass(currentOptionClass);
            }
            $(this).addClass(lastClickedRefOptionClass);
            lastClickedRef = null;
            lastClickedRefOptionClass = null;
        }
        $(this).addClass('selected');
    });
            
        // Get the parent container
        var container = $('section.worksheet')[0];
        if (!container) {
            // If the container doesn't exist, create it
            container = document.createElement('div');
            container.className = 'svg-dots';
            $('section.worksheet').append(container);
        }

       // Create SVG element
       var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
       svg.setAttribute("width", "100%");
       svg.setAttribute("height", "100%");
       svg.style.position = "absolute"; // Make the SVG overlay the container
       svg.style.top = 0;
       svg.style.left = 0;
       svg.style.zIndex = 1; // Ensure the SVG is above the other elements in the container
       svg.style.pointerEvents = "none"; // Ignore pointer events

       // Append the SVG to the container instead of the body

       // Create polyline for the SVG
       var polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
       polyline.setAttribute("stroke", "black");
       polyline.setAttribute("fill", "transparent");
       container.appendChild(svg);
       svg.appendChild(polyline);
       
       var circles = [];
       var selectedMatch = null;

      

       $('section.worksheet').on('click', '.ans-match', function(e) {
        var parentQuestion = $(this).closest('.question');

        // Calculate total matches within this question
        var totalMatches = parentQuestion.find('.ans-match').length / 2;
        // If the availablePairNumbers array is empty, re-initialize it
        var availablePairNumbers = parentQuestion.data('availablePairNumbers');
        if (!availablePairNumbers) {
            availablePairNumbers = Array.from({length: totalMatches}, (_, i) => i);
            parentQuestion.data('availablePairNumbers', availablePairNumbers);
        }

           var svgOffset = $(svg).offset();
           var x = e.pageX - svgOffset.left;
           var y = e.pageY - svgOffset.top;
       
           // If this element already has a circle, use it; otherwise, create a new one
           var circle = $(this).data('circle');
           if (!circle) {
               circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
               circle.setAttribute("cx", x);
               circle.setAttribute("cy", y);
               circle.setAttribute("r", 5); // radius of the circle
               circle.setAttribute("fill", "black");
               svg.appendChild(circle);
               $(this).data('circle', circle);
           }
       
           if (selectedMatch) {
               // Create a line between the selected match and this one
               var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
               var selectedCircle = selectedMatch.data('circle');
               line.setAttribute("x1", selectedCircle.getAttribute("cx"));
               line.setAttribute("y1", selectedCircle.getAttribute("cy"));
               line.setAttribute("x2", circle.getAttribute("cx"));
               line.setAttribute("y2", circle.getAttribute("cy"));
               line.setAttribute("stroke", "black");
               svg.appendChild(line);
       
               // Store the line and paired element in the data of the two elements
               selectedMatch.data('line', line).data('pair', $(this));
               $(this).data('line', line).data('pair', selectedMatch);
       
               var pairNumber = availablePairNumbers.pop();
               var pairClass = 'pair-' + pairNumber;
               selectedMatch.addClass(pairClass);
               $(this).addClass(pairClass);
       
               selectedMatch = null;
           } else if ($(this).data('line')) {
               // If this element is paired with another element, unpair it
               var line = $(this).data('line');
               var pair = $(this).data('pair');
               var pairClass = getClassStartingWith(pair[0], 'pair-');
               var pairNumber = parseInt(pairClass.split('-')[1]);
               availablePairNumbers.push(pairNumber);
               if (svg.contains(line)) {
                   svg.removeChild(line);
               }
               if (pair) {
                   var pairCircle = pair.data('circle');
                   if (svg.contains(pairCircle)) {
                       svg.removeChild(pairCircle);
                   }
                   pair.removeData('line').removeData('pair').removeData('circle');
       
                   // Remove the unique class from the unpaired elements
                   var pairClass = getClassStartingWith(pair[0], 'pair-');
                   $('.' + pairClass).removeClass(pairClass);
               }
               if (svg.contains(circle)) {
                   svg.removeChild(circle);
               }
               $(this).removeData('line').removeData('pair').removeData('circle');
           } else {
               // If there is no previously selected match, select this one
               selectedMatch = $(this);
           }
       });
       $('section.worksheet').on('click', '.ans-dots', function() {
        var dotValue = $(this).data('dots').toString();
        
        if ($(this).hasClass('selected') && _this.clickedDotsSequence[_this.clickedDotsSequence.length - 1] === dotValue) {
            _this.clickedDotsSequence.pop();
            lastDotIndex--;
            $(this).removeClass('selected dot-' + (lastDotIndex + 1));
    
            // Remove last point from polyline
            var points = polyline.getAttribute("points").split(" ");
            points.pop();
            polyline.setAttribute("points", points.join(" "));
    
            // Remove last circle from SVG and circles array
            var lastCircle = circles.pop();
            svg.removeChild(lastCircle);
        } else if (!$(this).hasClass('selected')) {
            _this.clickedDotsSequence.push(dotValue);
            lastDotIndex++;
            $(this).addClass('selected dot-' + lastDotIndex);
    
            // Add new point to polyline
            var offset = $(this).offset();
            var containerOffset = $(container).offset();
            var pointX = offset.left - containerOffset.left + $(this).width() / 2;
            var pointY = offset.top - containerOffset.top + $(this).height() / 2;
            var point = pointX + "," + pointY;
            var points = polyline.getAttribute("points");
            polyline.setAttribute("points", points ? points + " " + point : point);
    
            // Add a circle at this point
            var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("cx", pointX);
            circle.setAttribute("cy", pointY);
            circle.setAttribute("r", 5);
            circle.setAttribute("fill", "black");
            svg.appendChild(circle);
    
            // Add the circle to the circles array
            circles.push(circle);
        }
    });
    $('#reset').click(function() {
        var $activeQuestion = $('.question.active'); // Get the active question
        _this.resetQuestion($activeQuestion);
    });
        $('#submit').click(function() {
            _this.checkAnswers();
        });
    });
};

Hash.prototype.checkQuestion = function($question) {
    var questionType = $question.data('question');
    var isCorrect = false;   
    var allMatchesCorrect = true;
    var totalMatches = 0;
    var correctMatchAnswers = 0;
    console.log("Question Type: ", questionType);
    // Declare correctAnswer variable
    var correctAnswer = ''; // Default value

    if (questionType !== 'match') {
        correctAnswer = $question.find('.answer').data('answer') ? $question.find('.answer').data('answer').toString().toLowerCase() : "";
    }
    console.log("Correct Answer: ", correctAnswer);
    switch (questionType) {
            case 'select':
            case 'image':
                var userAnswer = $question.find('.selected').text().toLowerCase().trim() || $question.find('.selected').attr('alt');
                isCorrect = userAnswer === correctAnswer;
                break;
        
            case 'fill':
                userAnswer = $question.find('.ans-fill').text().toLowerCase().trim();
                isCorrect = userAnswer === correctAnswer;
                break;
        //JS Change 2
            case 'multi':
                isCorrect = true;
                var $subQuestions = $question.find('.inner.answer');
                $subQuestions.each(function() {
                    var correctAnswer = $(this).data('answer').toString().toLowerCase();
                    var userAnswer = $(this).find('.selected img').attr('alt').toLowerCase();
                    if (userAnswer !== correctAnswer) {
                        console.log("User Answer - false: ");
                        isCorrect = false;
                           return false;
                    }
                });
            
            break; 
            //End of JS Change 2
                case 'match':
                    // Calculate total matches within this question
                    totalMatches = $question.find('.ans-match').length / 2;
                    console.log("Total Matches: ", totalMatches);
                    allMatchesCorrect = true; // Initialize allMatchesCorrect to true
                    for (var i = 0; i < totalMatches; i++) {
                        console.log("Pair Counter: ", i);
                        var pairClass = 'pair-' + i;
                        var pairElements = $question.find('.' + pairClass);
                        if (pairElements.length === 2) {
                            console.log("Pair Elements: ", pairElements);
                            var matchElement1 = pairElements.eq(0);
                            var matchElement2 = pairElements.eq(1);
                            if (matchElement1.data('match') === matchElement2.data('match')) {
                                correctMatchAnswers++;
                                matchElement1.addClass('correct').removeClass('incorrect');
                                matchElement2.addClass('correct').removeClass('incorrect');
                            } else {
                                allMatchesCorrect = false;
                                matchElement1.addClass('incorrect').removeClass('correct');
                                matchElement2.addClass('incorrect').removeClass('correct');
                            }
                        } else {
                            allMatchesCorrect = false;
                            pairElements.addClass('incorrect').removeClass('correct');
                        }
                    }
                    isCorrect = allMatchesCorrect;
                    break;
                    case 'tiles':
                        var allTilesCorrect = true;
                        var totalTiles = $('.ans-ref', $question).length;
                        var selectedTiles = $('.ans-tiles.selected', $question).length;
                    
                        if (totalTiles !== selectedTiles) {
                            allTilesCorrect = false;
                            console.log("Not all tiles are selected");
                        }
                        $('.ans-tiles.selected', $question).each(function() {
                            console.log("Tiles");
                            var classList = $(this).attr('class').split(' ');
                            var tileClass = classList.find(c => c.startsWith('tile-'));
                            if (tileClass) {
                                var tileData = $(this).data('tiles');
                                var correspondingRef = $('.ans-ref.' + tileClass, $question);
                                var refData = correspondingRef.data('tiles');
                                if (tileData) { // Check if tileData is not undefined
                                    tileData = tileData.split(','); // Split the data into an array
                                    console.log("Tile Data: ", tileData);
                                    console.log("Ref Data: ", refData);
                                    if (!tileData.includes(refData)) { // Check if the selected option is in the list of correct options
                                        allTilesCorrect = false;
                                        console.log("All Tiles incorrect: ", allTilesCorrect);
                                        $(this).addClass('incorrect'); // Mark incorrect ans-tiles
                                        correspondingRef.addClass('incorrect'); // Mark corresponding ans-ref as incorrect
                                    } else {
                                        $(this).addClass('correct'); // Mark correct ans-tiles
                                        correspondingRef.addClass('correct'); // Mark corresponding ans-ref as correct
                                    }
                                } else { // If tileData is undefined, mark the tile as incorrect
                                    allTilesCorrect = false;
                                    console.log("All Tiles incorrect: ", allTilesCorrect);
                                    $(this).addClass('incorrect'); // Mark incorrect ans-tiles
                                    correspondingRef.addClass('incorrect'); // Mark corresponding ans-ref as incorrect
                                }
                            }
                        }); 
                        isCorrect = allTilesCorrect;
                        console.log("All Tiles Correct 2: ", isCorrect);
                        break;
                case 'options':
                    console.log("Options");
                    var allOptionsCorrect = true;
                    var totalOptions = $('.ans-options', $question).length;
                    var selectedOptions = $('.ans-options.selected', $question).length;
                    console.log("Total Options: ", totalOptions);
                    console.log("Selected Options: ", selectedOptions);
                    if (totalOptions !== selectedOptions) {
                        allOptionsCorrect = false;
                        console.log("Not all Options are selected");
                    }
                    $('.ans-options', $question).each(function() {
                        var optionClass = $(this).attr('class').split(' ').find(c => c.startsWith('option-'));
                        console.log("Option Class: ", optionClass);
                        if (optionClass) {
                            var optionData = $(this).data('options');
                            var correspondingRef = $('.ans-ref.' + optionClass, $question);
                            var refData = correspondingRef.data('options');
                            console.log("Option Data: ", optionData);
                            console.log("Ref Data: ", refData);
                            if (optionData !== refData) {
                                allOptionsCorrect = false;
                                $(this).addClass('incorrect'); // Mark incorrect ans-options
                                correspondingRef.addClass('incorrect'); // Mark corresponding ans-ref as incorrect
                            } else {
                                $(this).addClass('correct'); // Mark correct ans-options
                                correspondingRef.addClass('correct'); // Mark corresponding ans-ref as correct
                            }
                        }
                    });
                    isCorrect = allOptionsCorrect;
                    break;
                    // Validation logic for 'dots'
                    case 'dots':
                        console.log("Dots");
                        var _this = this;
                        var answerElement = $question.find('.answer');
                        console.log("Answer Element: ", answerElement);
                        var correctSequence = answerElement.data('answer').split(' ');
                        console.log("Correct Sequence: ", correctSequence);
                        var isCorrect = (correctSequence.length === _this.clickedDotsSequence.length) &&
                                        correctSequence.every(function(value, index) { 
                                            return value === _this.clickedDotsSequence[index]; 
                                        });
                        console.log("User Clicked Sequence: ", _this.clickedDotsSequence);  // Add this line

                        // Apply visual feedback
                        $('.ans-dots', this).each(function() {
                            var dotNumber = $(this).data('dots').toString();
                            if (_this.clickedDotsSequence.includes(dotNumber)) {
                                if (isCorrect) {
                                    $(this).addClass('correct').removeClass('incorrect');
                                } else {
                                    $(this).addClass('incorrect').removeClass('correct');
                                }
                            }
                        });
                    
                        // Reset clickedDotsSequence after checking
                        _this.clickedDotsSequence = [];
                        lastDotIndex = 0;
                        break;
                    
                    
                default:
                    // Handle unknown question types or do nothing
                    break;
    }

    return {
        isCorrect: isCorrect,
        correctAnswer: correctAnswer,
        totalMatches: totalMatches,
        correctMatchAnswers: correctMatchAnswers
    };
};

// Initialize popup
// $("#congrats-popup").dialog({
//     autoOpen: false,
//     modal: true,
//     resizable: false,
//     draggable: false,
//     closeOnEscape: true,
//     dialogClass: "custom-overlay", // Add a custom class to the dialog
//     open: function() {
//         // Remove the title bar
//         $(".ui-dialog-titlebar").hide();

//         // Make the dialog fullscreen
//         $(this).parent().css({
//             position: 'fixed',
//             left: 0,
//             right: 0,
//             top: 0,
//             bottom: 0,
//             width: '100%',
//             height: '100%'
//         });

//         // Make the content fullscreen
//         $(this).css({
//             width: '100%',
//             height: '100%',
//             overflow: 'hidden'
//         });
//     }
// }).click(function() {
//     $(this).dialog("close");
// });


$(document).ready(function() {
    var submitClicked = false; // Track whether the submit button has been clicked

    // Initialize popup
    $("#congrats-popup").dialog({
        autoOpen: false,
        modal: true,
        resizable: false,
        draggable: false,
        closeOnEscape: true, // Allow closing the dialog on Esc key press
        dialogClass: "custom-overlay", // Add a custom class to the dialog
        open: function() {
            // Remove the title bar
            $(".ui-dialog-titlebar").hide();

            // Make the dialog fullscreen
            $(this).parent().css({
                position: 'fixed',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                width: '100%',
                height: '100%'
            });

            // Make the content fullscreen
            $(this).css({
                width: '100%',
                height: '100%',
                overflow: 'hidden'
            });
        }
    }).click(function() {
        $(this).dialog("close"); // Close the dialog when clicked
    });

    // Close the dialog when the Esc key is pressed
    $(document).on('keydown', function(event) {
        if (event.key === "Escape") { // Check if the Esc key is pressed
            $("#congrats-popup").dialog("close"); // Close the dialog
        }
    });

    // Regular action when submit button is clicked (no reload initially)
    $('#submit').click(function(event) {
        if (submitClicked) {
            // Close the dialog if it's already open on the second click
            $("#congrats-popup").dialog("close");
            submitClicked = false; // Reset the click tracker
        } else {
            // Perform the regular submit action
            console.log('Submit button clicked'); // Your regular action here
            // Open the dialog (popup)
            $("#congrats-popup").dialog("open");
            submitClicked = true; // Mark that the submit has been clicked once
        }
    });
});


function updateDatabaseForQuestion() {
    // $.ajax({
    //     url: myAjax.ajaxurl,
    //     type: 'POST',
    //     data: {
    //         action: 'handle_question',
    //         questionId: currentQuestionId,
    //         questionResult: currentQuestionResult
    //     },
    //     success: function(response) {
    //         console.log('Database updated successfully for question', response);
    //     },
    //     error: function(error) {
    //         console.error('Error updating database for question', error);
    //     }
    // });
}

function QuestionCompleted() {
    $.ajax({
        url: myAjax.ajaxurl,
        type: 'POST',
        data: {
            action: 'handle_last_question',
        },
        success: function(response) {
            console.log('Database updated successfully for last question', response);
        },
        error: function(error) {
            console.error('Error updating database for last question', error);
        }
    });
}
Hash.prototype.checkAnswers = function() {
    var _this = this;

    $('section.worksheet').each(function() {
        var totalQuestions = $(this).find('.question').length;
        var allQuestions = $(this).find('.question');

        var $currentQuestion = allQuestions.filter('.active');
        var $nextQuestion = $currentQuestion.next('.question'); 
        var result = _this.checkQuestion($currentQuestion);
        var isCorrect = result.isCorrect; // Extract the isCorrect value from the object

        if (isCorrect) {
            $currentQuestion.addClass('correct').removeClass('incorrect');
            $("#congrats-popup").html('<img src="img/correct.png" class="result-image" />'); // Set the content of the dialog box to the correct image
            $("#congrats-popup").dialog({
                close: function() {
                    if ($nextQuestion.length) { 
                        _this.updateQuestionDisplay($currentQuestion, totalQuestions, true);
                        _this.moveToNextQuestion($currentQuestion); // Move this line here
                        updateDatabaseForQuestion(); // Case 1: Update the database for a question
                    } else {
                        QuestionCompleted(); // Case 2: Update the database for the last question
                        $('.popup').css('display', 'block');
                        console.log("Worksheet completed");
                    }
                }
            }).dialog("open");
        } else {
            $currentQuestion.addClass('incorrect').removeClass('correct');
            $("#congrats-popup").html('<img src="img/wrong.png" class="result-image" />'); // Set the content of the dialog box to the incorrect image
            $("#congrats-popup").dialog("open");
        }
    });

    function QuestionCompleted() {
        // Show completion text or perform any other action
        // alert('Congratulations! You have completed all the questions.');
        // jQuery to show the custom alert box
        $('#custom-alert').show();

        // jQuery to hide the custom alert box
        $('#close-alert').on('click', function() {
            $('#custom-alert').hide();
        });
    }
};
Hash.prototype.resetQuestion = function($question) {
    var activeQuestionClass = $question.attr('class').split(' ').find(c => c.startsWith('q'));
    if (activeQuestionClass && this.initialStates[activeQuestionClass]) { // Make sure activeQuestionClass and this.initialStates[activeQuestionClass] are defined
        $question.removeClass('correct incorrect');
        $question.html(this.initialStates[activeQuestionClass]); // Use this.initialStates here

       
    }
};
//JS Change 3
Hash.prototype.moveToNextQuestion = function($currentQuestion) {
    $currentQuestion.removeClass('active').trigger('classChanged').hide();
    var $nextQuestion = $currentQuestion.next('.question');
    if ($nextQuestion.length) {
        $nextQuestion.addClass('active').trigger('classChanged').show();

        // Get the SVG and polyline
        var svg = document.querySelector('svg');
        var polyline = document.querySelector('polyline');

        // Remove all circles from the SVG
        var circles = svg.querySelectorAll('circle');
        circles.forEach(function(circle) {
            svg.removeChild(circle);
        });
        // Remove all lines from the SVG
        var lines = svg.querySelectorAll('line');
        lines.forEach(function(line) {
            svg.removeChild(line);
        });
        // Clear the points from the polyline
        polyline.setAttribute("points", "");

        $currentQuestion.find('.ans-match, .ans-dots').each(function() {
            var $this = $(this);
            $this.removeData('circle').removeData('line').removeData('pair');
            $this.removeClass(function(index, className) {
                return (className.match(/(^|\s)dot-\S+/g) || []).join(' ');
            });
        });
    } 
};
//End of JS Change 3
Hash.prototype.updateQuestionDisplay = function($currentQuestion, totalQuestions, isNextQuestion) {
    var currentQuestionIndex = $currentQuestion.parent().children().index($currentQuestion);

    console.log("current Questions: ", currentQuestionIndex);
    // Update question count display
    $('#h1 .n0-i1 p').text(`${currentQuestionIndex + 1 + (isNextQuestion ? 1 : 0)} / ${totalQuestions}`);
};
    // Make Hash globally accessible
    window.Hash = Hash;
})(jQuery);