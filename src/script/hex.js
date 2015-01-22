// Globals
var is_mobile = (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
//is_mobile = false;
var is_desktop = !(is_mobile);
var rows = [
  ['Db', 'Eb', 'Gb', 'Bb'],
  ['D', 'F', 'Ab', 'B'],
  ['C', 'E', 'G', 'A']
];
var keyMap = [
  [87, 69, 82, 84, 89, 85, 73, 79, 80],
  [83, 68, 70, 71, 72, 74, 75, 76, 186],
  [90, 88, 67, 86, 66, 78, 77, 188, 190]
];
var startingOctave = 2;
var notesPerOctave = 4;
var keysPerRow = 9;
var a_context;
var master_gain;
var notesPlaying = {};

// Functions


var initSynths = function(){
  a_context = window.AudioContext ? new AudioContext() : new webkitAudioContext();
  master_gain = a_context.createGain();
  master_gain.gain.value = 0.2;
  master_gain.connect(a_context.destination);
};

var recompute_gain = function () {
  var total = 0;
  for (var prop in notesPlaying) {
    if (notesPlaying.hasOwnProperty(prop))
      total++;
  }
  console.log("DRC count: " + total);
  total += 0.1;
  master_gain.gain.value = 1.0 / total;
};

var startNote = function (note) {
  console.log('startNote', note);
  var i;
  // Check to see if the note is already playing.
  if (notesPlaying.hasOwnProperty(note))
    return;
  // Otherwise, add it to the list, and start
  var osc = notesPlaying[note] = a_context.createOscillator();
  osc.frequency.value = getNoteFrequency(note)*2;
  osc.connect(master_gain);
  osc.start(0);
  recompute_gain();
};
var stopNote = function (note) {
  console.log('stopNote', note);
  var i;
  if (! notesPlaying.hasOwnProperty(note))
  return;
  notesPlaying[note].stop(0);
  delete notesPlaying[note];
  recompute_gain();
};

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
    var keyHTML = '<div class="key"><div class="hexagon"><div class="hexagon-in1"><div class="hexagon-in2" data-note="' + note + octave + '">';
    var sup;

    if (incidental == '') {
      keyHTML += '<h1>' + note + '<sub>' + octave + '</sub></h1>';
    } else {
      sup = (incidental === 'b') ? '&#x266d;' : '&#x266f;';
      keyHTML += '<h1 class="incidental">' + note.substring(0, 1) + '<sup>' + sup + '</sup><sub>' + octave + '</sub></h1>';
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

var init = function(){
  initSynths();

  // Show / hide notation
  $('#notation').click(function(){
    $('.key h1').toggle();
  });
};



// ----------------------------------
// Desktop & Keyboard, Mouse Handling
// ----------------------------------

if (is_desktop){
  init();

  // Mouse
  $('#keys').on('mousedown', '.hexagon-in2', function(){
    $('.hexagon-in2').removeClass('active');
    $(this).addClass('active');
    startNote($(this).data('note'));
  });
  $('#keys').on('mouseup', '.hexagon-in2', function(){
    $('.hexagon-in2').removeClass('active');
    stopNote($(this).data('note'));
  });

  // Keyboard
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


  var keysDown = {};

  var getKeyPressed = function (keyCode) {
    var i, l, j, m, note, octave;
    for (i = 0, l = keyMap.length; i < l; i++) {
      for (j = 0, m = keyMap[i].length; j < m; j++) {
        if (keyCode === keyMap[i][j]) {
          note = rows[i][j % notesPerOctave];
          octave = startingOctave + Math.floor(j / notesPerOctave);
          return note + octave;
        }
      }
    }
  };
  var keyboardDown = function (e) {
    var note;

    if (
      e.defaultPrevented
      || e.altKey
      || e.ctrlKey
      || e.metaKey
      || e.keyCode in keysDown
    ) {
      return;
    }

   keysDown[e.keyCode] = true;

   note = getKeyPressed(e.keyCode);

   if (note) {
     startNote(note);
   }
  };
  var keyboardUp = function (e) {
    var note;

    if (
      e.defaultPrevented
      || e.altKey
      || e.ctrlKey
      || e.metaKey
    ) {
      return;
    }

    delete keysDown[e.keyCode];

    note = getKeyPressed(e.keyCode);

    if (note) {
      stopNote(note);
    }
  };

  window.addEventListener('keydown', keyboardDown);
  window.addEventListener('keyup', keyboardUp);
}



// -----------------------
// Mobile & Touch Handling
// -----------------------

if (is_mobile) {
  init();

  /* from Tone.js/examples/Widgets.js */
  /*$('body').append('<div class="playOverlay"><button>\u25B6</button></div>');
  $('.playOverlay').on('click', function(){
    //startNote('Db2');
    //window.setTimeout(function(){ stopNote('Db2'); }, 1000);

    $(this).remove();

    //playChord();
  });*/

  // Keyboard
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

  var ongoingTouches = new Array();

  var copyTouch = function (touch, $el, note) {
    var copiedTouch = { identifier: touch.identifier, pageX: touch.pageX, pageY: touch.pageY, $el: touch.$el, note: touch.note };

    if ($el !== void 0) copiedTouch.$el = $el;
    if (note !== void 0) copiedTouch.note = note;

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
        note,
        index,
        lastTouch;

    if (e.type === 'touchstart') {
      for (i = 0; i < touches.length; i++) {
        $el = $(document.elementFromPoint(touches[i].pageX, touches[i].pageY)).closest('.hexagon-in2');
        note = $el.data('note');
        ongoingTouches.push(copyTouch(touches[i], $el, note));
        if (note !== void 0) {
          //$('.hexagon-in2').removeClass('active');
          $el.addClass('active');

          startNote(note);
        }
      }
    } else if (e.type === 'touchmove') {
      for (i = 0; i < touches.length; i++) {
        index = ongoingTouchIndexById(touches[i].identifier);
        if(index >= 0) {
          lastTouch = copyTouch(ongoingTouches[index]);
          $el = $(document.elementFromPoint(touches[i].pageX, touches[i].pageY)).closest('.hexagon-in2');
          note = $el.data('note');
          ongoingTouches.splice(index, 1, copyTouch(touches[i], $el, note));
          if (note !== lastTouch.note && lastTouch.$el) {
            lastTouch.$el.removeClass('active');

            stopNote(lastTouch.note);
          }
          if (note !== lastTouch.note && note !== void 0) {
            $el.addClass('active');

            startNote(note);
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
      var note = lastTouch.$el.data('note');
          stopNote(note);
          //synth.triggerRelease();
        } else {
          console.error('can\'t figure out which touch to end');
        }
      }
    }
  });
}

