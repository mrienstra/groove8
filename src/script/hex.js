// Globals
var rows = [
  ['Db', 'Eb', 'Gb', 'Bb'],
  ['D', 'F', 'Ab', 'B'],
  ['C', 'E', 'G', 'A']
];
var num_hex = 8;



var generateRowOfKeys = function (index, row) {
  var rowOfKeys = [];
  var i;
  for (i = 0; i < num_hex; i++) {
    var note = row[(i % row.length)];
    var incidental = note.substring(1, 2);
    var keyHTML = '<div class="key"><div class="hexagon"><div class="hexagon-in1"><div class="hexagon-in2">';
    var sup;

    if (incidental == '') {
      keyHTML += '<h1>' + note + '</h1>';
    } else {
      sup = (incidental === 'b') ? '&#x266d;' : '&#x266f;';
      keyHTML += '<h1 class="incidental">' + note.substring(0, 1) + '<sup>' + sup + '</sup></h1>';
    }
    keyHTML += '</div></div></div></div>';

    rowOfKeys.push(keyHTML);
  }

  var rowDIV = document.createElement('div');
  rowDIV.id = 'r' + index;
  rowDIV.className = 'row';
  rowDIV.innerHTML = rowOfKeys.join('');
  return rowDIV;
}

var sizeKeys = function(){
  var new_size = '200%';
  $('html').css('font-size', new_size);
  $('body').css('font-size', new_size);
}

var insertRow = function (index, row, container) {
  var rowOfKeys = generateRowOfKeys(index, row);
  container.appendChild(rowOfKeys);
};



var keysContainer = document.getElementById('keys');

var i, l;
for (i = 0, l = rows.length; i < l; i++) {
  console.log('i', i);
  insertRow(i, rows[i], keysContainer);
};

sizeKeys();

// Show / hide letters
$('#letters').click(function(){
  $('.key h1').toggle();
});