// Globals
var rows = [
  ['Db', 'Eb', 'Gb', 'Bb'],
  ['D', 'F', 'Ab', 'B'],
  ['C', 'E', 'G', 'A']
];
var startingOctave = 2;
var notesPerOctave = 4;
var keysPerRow = 9;

// Functions
var getNoteFrequency = function (note) {
  // See `src/script/lib/music.js-5277f8a.js`
  return Note.fromLatin(note).frequency();
};

var generateRowOfKeys = function (index, row) {
  var rowOfKeys = [];
  var octave;
  var i;
  for (i = 0; i < keysPerRow; i++) {
    var note = row[(i % row.length)];
    var incidental = note.substring(1, 2);
    var octave = startingOctave + Math.floor(i / notesPerOctave);
    var keyHTML = '<div class="key"><div class="hexagon"><div class="hexagon-in1"><div class="hexagon-in2" data-frequency="' + getNoteFrequency(note + octave) + '">';
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

var sizeKeys = function(container){
  var keyboard_width = container.offsetWidth;
  var key_width = keyboard_width / (keysPerRow+1);
  var key_height = key_width * 2 / Math.sqrt(3);
  var rows_height = key_height * 2.5;
  // set top padding
  container.style.paddingTop = 0;
  var padding_top = (container.offsetHeight - rows_height) / 2;
  container.style.paddingTop = padding_top;
  // set key size
  var new_size = (key_width*1.5625)+'%'; // 62.5% = 40px width
  $('html').css('font-size', new_size);
  $('body').css('font-size', new_size);
}

var insertRow = function (index, row, container) {
  var rowOfKeys = generateRowOfKeys(index, row);
  container.appendChild(rowOfKeys);
};

var initKeyboard = function(container) {
  var i, l;
  for (i = 0, l = rows.length; i < l; i++) {
    insertRow(i, rows[i], container);
  };
  sizeKeys(container);
  container.style.visibility = "visible";
  window.onresize = function(event) {
    sizeKeys(container);
  }
}

initKeyboard(document.getElementById('keys'));

// Show / hide notation
$('#notation').click(function(){
  $('.key h1').toggle();
});

var synth = new Tone.FMSynth();
synth.setVolume(-10);
synth.toMaster();

$('#keys').on('mousedown', '.hexagon-in2', function(){
  $('.hexagon-in2').removeClass('active');
  $(this).addClass('active');
  synth.triggerAttack($(this).data('frequency'));
});
$('#keys').on('mouseup', '.hexagon-in2', function(){
  $('.hexagon-in2').removeClass('active');
  synth.triggerRelease();
});

var ongoingTouches = new Array();

var copyTouch = function (touch, $el, frequency) {
  var copiedTouch = { identifier: touch.identifier, pageX: touch.pageX, pageY: touch.pageY, $el: touch.$el, frequency: touch.frequency };

  if ($el !== void 0) copiedTouch.$el = $el;
  if (frequency !== void 0) copiedTouch.frequency = frequency;

  return copiedTouch;
}

var ongoingTouchIndexById = function (idToFind) {
  var i;
  var id;
  for (i = 0; i < ongoingTouches.length; i++) {
    id = ongoingTouches[i].identifier;

    if (id == idToFind) {
      return i;
    }
  }
  return -1;
}

$('#keys').on('touchstart touchmove touchend touchcancel touchleave', function (e) {
  e.preventDefault();

  var i,
      touches = e.originalEvent.changedTouches,
      $el,
      frequency,
      index,
      lastTouch;

  if (e.type === 'touchstart') {
    for (i = 0; i < touches.length; i++) {
      $el = $(document.elementFromPoint(touches[i].pageX, touches[i].pageY)).closest('.hexagon-in2');
      frequency = $el.data('frequency');
      ongoingTouches.push(copyTouch(touches[i], $el, frequency));
      if (frequency !== void 0) {
        $('.hexagon-in2').removeClass('active');
        $el.addClass('active');

        synth.triggerAttack(frequency);
      }
    }
  } else if (e.type === 'touchmove') {
    for (i = 0; i < touches.length; i++) {
      index = ongoingTouchIndexById(touches[i].identifier);
      if(index >= 0) {
        lastTouch = copyTouch(ongoingTouches[index]);
        $el = $(document.elementFromPoint(touches[i].pageX, touches[i].pageY)).closest('.hexagon-in2');
        frequency = $el.data('frequency');
        ongoingTouches.splice(index, 1, copyTouch(touches[i], $el, frequency));
        if (frequency !== lastTouch.frequency && lastTouch.$el) {
          lastTouch.$el.removeClass('active');
        }
        if (frequency !== lastTouch.frequency && frequency !== void 0) {
          $el.addClass('active');

          synth.triggerAttack(frequency);
        }
      } else {
        console.error('can\'t figure out which touch to continue');
      }
    }
  } else if (['touchend', 'touchcancel', 'touchleave'].indexOf(e.type) !== -1) {
    for (i = 0; i < touches.length; i++) {
      index = ongoingTouchIndexById(touches[i].identifier);
      if(index >= 0) {
        lastTouch = ongoingTouches[index];
        ongoingTouches.splice(index, 1);
        lastTouch.$el.removeClass('active');

        synth.triggerRelease();
      } else {
        console.error('can\'t figure out which touch to end');
      }
    }
  }
});

/* from Tone.js/examples/Widgets.js */
if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
  $('body').append('<div class="playOverlay"><button>\u25B6</button></div>');
  $('.playOverlay').on('click', function(){
    Tone.startMobile();
    $(this).remove();
  });
}
