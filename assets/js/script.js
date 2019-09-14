var scavengerQuestions = [];
var puzzleQuestions = [];
var maxWidth = 85;
var EndGame=false;
var Minutes=60;
var Penalty=2.2;
//amount of time to be deducted for wrong answer - expressed as percentage of hour
var tntRemaining=35;

function getQuestions() {
  var data;
  var puzzleQuestionTrigger = false;
  $.ajax({
    type: "GET",
    url: "assets/data/questions.csv",
    dataType: "text",
    success: function(response) {
      var rows = response.split(/\n/);
      for (i = 1; i < rows.length; i++) {
        var scavengerQuestion = [];
        var puzzleQuestion = [];
        // For every row - split it into columns
        var columns = rows[i].split(/,/);
        for (var colIndex in columns) {
          var colValue = columns[colIndex].trim();
          // here you have the colValue to play with
          if (colValue == "puzzle") {
            puzzleQuestionTrigger = true;
          }
          else if (puzzleQuestionTrigger == false) {
            scavengerQuestion.push(colValue);
          }
          else {
            puzzleQuestion.push(colValue);
          }
        }
        if (scavengerQuestion != "") {
          scavengerQuestions.push(scavengerQuestion);
        }
        if (puzzleQuestion != "") {
          puzzleQuestions.push(puzzleQuestion);
        }
      }
    }
  });
}

function move() {
  //set minutes for timer
  //set the amount by which the width is reduced each time interval
  var adjustment = 0.5
  //recalculate the minutes to account for the adjustment.
  Minutes = Minutes * adjustment;
  var width = maxWidth;
  var ms = Minutes / width * 60000;
  var fuse = $('.fuse-bar');
  var flame = $('#flame');
  var left = $(window).width();
  var id = setInterval(frame, ms);

  function frame() {
    if (width <= 0 && EndGame==false) {
      clearInterval(id);
      explosion();
    }
    else {
      var currentWidth = parseInt(fuse.css('width'));
      //gives width in px
      width = currentWidth / $(window).width() * 100;
      //change to percent and reduce by 0.5%
      width = width - adjustment;
      fuse.css('width', width + '%');
      flame.css({ 'left': width + '%' });
    }
  }
}

function displayQuestion(questionButton) {
  var correctAnswer=$(questionButton).attr("correct");
  setTimeout(function() { $('#answer').focus() },250);
  if (Boolean(correctAnswer) != true) {
    console.log($(questionButton).attr("correct"))
    questionNumber = $(questionButton).text();
    $("#question-modal-title").text("Clue " + questionNumber);
    $(document).attr('question-button', questionButton);
    questionNumber = parseInt(questionNumber) - 1;
    if ($(questionButton).closest('.col-4').hasClass("scavenger")) {
      $("#modal-question-text").text(scavengerQuestions[questionNumber][0]);
      $(document).attr("answer", scavengerQuestions[questionNumber][1]);

    }
    else if ($(questionButton).closest('.col-4').hasClass("puzzle")) {
      $("#modal-question-text").text(puzzleQuestions[questionNumber][0]);
      $(document).attr("answer", puzzleQuestions[questionNumber][1]);
    }
    $("#question-modal").modal({
      show: true
    });
  }
}

function deselect(questionButton) {
  questionButton.blur();
}

function checkAnswer() {
  var submittedAnswer = $("#answer").val();
  var answer = $(document).attr("answer");
  $("#answer").val("");
  $("#question-modal").modal('hide');
  if (submittedAnswer == answer) {
    removeTNT();
  }
  else {
    reduceTime();
  }
}

function removeTNT() {
  $("#sfx").attr('src','assets/sounds/correct.wav')
  $("#sfx")[0].play();  
  var questionButton = $(document).attr('question-button');
  tntRemaining=$('.tnt-count p').text();
  tntRemaining--;
  $(questionButton).removeClass("wrong-answer").addClass("right-answer");
  $(questionButton).attr("correct", true);
  $('.answer-mark img').attr('src','assets/images/tick.png');
  $('.answer-mark').fadeToggle("fast");
  setTimeout(function() { $('.answer-mark').fadeToggle("medium"); },1000);
  $('.tnt').addClass("tnt-animation");
  setTimeout(function() { $('.tnt').fadeOut(500)},1500);
  setTimeout(function() { $('.tnt').removeClass('tnt-animation'); $('.tnt').fadeIn(0);},2000);
  setTimeout(function() { $('.tnt-count p').text(tntRemaining)},1500);
  if(tntRemaining==0) {
    endGame();
  }
  
}

function reduceTime() {
  $("#sfx").attr('src','assets/sounds/wrong.wav')
  $("#sfx")[0].play();  
  var questionButton = $(document).attr('question-button');
  console.log(questionNumber)
  var fuse = $('.fuse-bar');
  var flame = $('#flame');
  var currentWidth = parseInt(fuse.css('width'));
  //gives width in px
  width = currentWidth / $(window).width() * 100;
  //change to percent and reduce by 0.5%
  width = width - Penalty;
  fuse.css('width', width + '%');
  flame.css({ 'left': width + '%' });
  $(questionButton).addClass("wrong-answer");
  $('.answer-mark img').attr('src','assets/images/cross.png');
  $('.answer-mark').fadeToggle("fast");
  setTimeout(function() { $('.answer-mark').fadeToggle("medium"); },1000);
    if (width <= 0) {
      EndGame=true;
      setTimeout(function() { explosion(); },1500);
    }  
}


$(document).ready(function() {
  $(".questions button").on("click", function() { displayQuestion($(this)) });
  $(".questions button").mouseout(function() { deselect($(this)) });
  $("#question-modal .btn-success").on("click", function() { checkAnswer() });
  $(document).on("keypress","#answer", function(event) { if(event.which==13) { checkAnswer(); } });
  $(".start-button-container button").on("click", function() {
    $(".start-button-container p").html("Oh dear. You just armed the bomb.<br>You know you really shouldn't do everything a computer tells you to do.<br>Well, you have "+Minutes+" minutes...<br>Good luck!");
    $(".start-button-container button").fadeOut(0);
    setTimeout(function() { $(".game-start-overlay").fadeOut(500); move(); },8000);

    
  })
  getQuestions();

});

function endGame() {
  $("#sfx").attr('src','assets/sounds/fanfare.ogg');
  $(".game-over").css({"color":"green","line-height":"25vh"});
  $(".game-over").html("<p>CONGRATULATIONS</p><p>You defused all the bombs!</p>");
  setTimeout(function() { $(".game-over").fadeIn("slow"); $("#sfx")[0].play(); },2000);
}

function explosion() {
  $("#sfx").attr('src','assets/sounds/explosion.wav')
  $("#sfx")[0].play();
  var bombs;
  if(tntRemaining==40) {
    bombs="You did not defuse any bombs!"
  }
  else if(tntRemaining==39) {
    bombs="You defused 1 bomb.";
  }
  else {
    bombs="You defused "+parseInt(40-tntRemaining)+" bombs.";
  }
    $(".game-over").css("line-height","25vh");
    $(".game-over").html("<p>GAME OVER</p><p>"+bombs+"</p><p>Not good enough!</p>")
  $(".explosion").css("display","block");
  setTimeout(function() { $(".game-over").fadeIn("slow"); },1500);

}