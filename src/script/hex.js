// Globals
var row_1 = ["Db", "Eb", "Gb", "Bb"];
var row_2 = ["D", "F", "Ab", "B"];
var row_3 = ["C", "E", "G", "A"];

var num_hex = 8;

function generateRow(){
  
}

function generateLetters(row) {
  for (i=0; i<num_hex; i++) {
    var note = row[(i % row.length)];
    var incidental = note.substring(1,2);
    var output = '';
    if (incidental == '') {
      output = '<h1>'+note+'</h1>';
    } else {
      var sup = (incidental == 'b') ? '&#x266d;' : '&#x266f;';
      output = '<h1 class="incidental">'+note.substring(0,1)+'<sup>'+sup+'</sup></h1>';
    }
    console.log(output);
  }
}

generateLetters(row_2);

// Show / hide letters
$('#letters').click(function(){
  $('.key h1').toggle();
});