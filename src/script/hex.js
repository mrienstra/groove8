// Globals
var is_mobile = (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
//is_mobile = false;
var is_desktop = !(is_mobile);

var attackTime = 0.05;
var decayTime = 0.1;
var gainLow = 0.25;
var gainHigh = 0.75;

var scales = {
  i: {
    rows: [
      ['Db', 'Eb', 'Gb', 'Bb'],
      ['D', 'F', 'Ab', 'B'],
      ['C', 'E', 'G', 'A']
    ],
    octaveOffsets: [0, -1, 0]
  },
  iv: {
    rows: [
      ['B', 'Eb', 'Gb', 'Ab'],
      ['Db', 'E', 'G', 'Bb'],
      ['C', 'D', 'F', 'A']
    ],
    octaveOffsets: [-1, -1, 0]
  },
  v: {
    rows: [
      ['Db', 'F', 'Ab', 'Bb'],
      ['Eb', 'Gb', 'A', 'C'],
      ['D', 'E', 'G', 'B']
    ],
    octaveOffsets: [0, 0, 0]
  }
};
var keyMap = [
  [87, 69, 82, 84, 89, 85, 73, 79, 80],
  [83, 68, 70, 71, 72, 74, 75, 76, 186],
  [90, 88, 67, 86, 66, 78, 77, 188, 190]
];
var current_scale_name = 'i';
var current_keys;
var previous_keys;
var startingOctave = 3;
var notesPerOctave = 4;
var keysPerRow = 9;

var tallerKeys = true;

var a_context;
var master_gain;
var notesPlaying = {};

// Functions


var initSynths = function(){
  a_context = window.AudioContext ? new AudioContext() : new webkitAudioContext();
  master_gain = a_context.createGain();
  master_gain.gain.value = 1;
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
  var n;

  if (notesPlaying.hasOwnProperty(note)) {
    n = notesPlaying[note];
    n.g.gain.cancelScheduledValues(a_context.currentTime);
    n.g.gain.setValueAtTime(n.g.gain.value, a_context.currentTime);
  } else {
    n = notesPlaying[note] = {
      o: a_context.createOscillator(),
      g: a_context.createGain(),
    };
    n.g.gain.value = gainLow;
    n.g.connect(a_context.destination);
    n.o.frequency.value = getNoteFrequency(note) * 2;
    n.o.connect(n.g);
    n.o.start(0);
  }
  n.g.gain.linearRampToValueAtTime(gainHigh, a_context.currentTime + attackTime);
};
var stopNote = function (note) {
  console.log('stopNote', note);
  var n = notesPlaying[note];
  n.g.gain.cancelScheduledValues(a_context.currentTime);
  n.g.gain.setValueAtTime(n.g.gain.value, a_context.currentTime);
  n.g.gain.linearRampToValueAtTime(0.0, a_context.currentTime + decayTime);
};

var getNoteFrequency = function (note) {
  // See `src/script/lib/music.js-5277f8a.js`
  return Note.fromLatin(note).frequency();
};

var addOctavesToRows = function (rows) {
  var octaveOffsets, rowsWithOctaves, i, l, octave, rowsWithOctaves, j, a, note, thisFreq, lastFreq;

  octaveOffsets = scales[current_scale_name].octaveOffsets || [];
  rowsWithOctaves = [];

  window.allNotes = {};

  for (i = 0, l = rows.length; i < l; i++) {
    octave = startingOctave + (octaveOffsets[i] || 0);
    rowWithOctaves = [];

    if (i === 1) {
      note = rows[i][(3 % rows[i].length)];
      rowWithOctaves.push(note + octave);
      allNotes[i + '-' + 0] = note + octave;
      lastFreq = getNoteFrequency(note + octave);
      a = 1;
    } else {
      lastFreq = void 0;
      a = 0;
    }

    for (j = 0; j < keysPerRow; j++) {
      note = rows[i][(j % rows[i].length)];

      thisFreq = getNoteFrequency(note + octave);
      if (lastFreq && lastFreq > thisFreq) octave++;
      lastFreq = thisFreq;

      rowWithOctaves.push(note + octave);

      allNotes[i + '-' + (j + a)] = note + octave;
    }

    rowsWithOctaves.push(rowWithOctaves);
  };

  console.log('rowsWithOctaves', rowsWithOctaves);

  return rowsWithOctaves;
};

var generateRowOfKeys = function (index, row) {
  var i, l, note, incidental, keyHTML, sup, rowOfKeys, rowDIV;

  rowOfKeys = [];

  if (index === 1) {
    l = keysPerRow + 1;
  } else {
    l = keysPerRow;
  }

  for (i = 0; i < l; i++) {
    note = row[(i % row.length)];
    incidental = (note.length === 3) ? note.substring(1, 2) : void 0;

    keyHTML = '<div class="key"><div class="hexagon"><div class="hexagon-in1"><div class="hexagon-in2" data-id="' + index + '-' + i + '">';

    /*if (incidental) {
      sup = (incidental === 'b') ? '&#x266d;' : '&#x266f;';
      keyHTML += '<h1 class="incidental">' + note.substring(0, 1) + '<sup>' + sup + '</sup><sub>' + note.substring(2, 3) + '</sub></h1>';
    } else {
      keyHTML += '<h1>' + note.substring(0, 1) + '<sub>' + note.substring(1, 2) + '</sub></h1>';
    }*/

    keyHTML += '</div></div></div></div>';

    rowOfKeys.push(keyHTML);
  }

  rowDIV = document.createElement('div');
  rowDIV.className = 'row row' + index;
  rowDIV.innerHTML = rowOfKeys.join('');

  return rowDIV;
}

var sizeKeys = function(container){
  var keyboard_width = container.offsetWidth;
  var key_width = keyboard_width / (keysPerRow + 1.5);
  var key_height = key_width * 2 / Math.sqrt(3);
  var rows_height = key_height * 2.5;
  // set top padding
  container.style.paddingTop = 0;
  var padding_top = (container.offsetHeight - rows_height) / 2;
  container.style.paddingTop = padding_top;
  // set key size
  var new_size;
  if (tallerKeys) {
    new_size = (key_width * 1.82) + '%'; // 62.5% = 40px width
  } else {
    new_size = (key_width * 1.5625) + '%'; // 62.5% = 40px width
  }
  $('html').css('font-size', new_size);
  $('body').css('font-size', new_size);
}

var insertRow = function (index, row, container) {
  var rowOfKeys = generateRowOfKeys(index, row);
  container.appendChild(rowOfKeys);
};

var insertControls = function (index, container) {
  var controlsDiv = document.createElement('div');
  controlsDiv.id = 'r' + index;
  controlsDiv.className = 'row controlsRow';
  controlsDiv.innerHTML = '\
    <div class="key"><div class="hexagon"><div class="hexagon-in1"><div class="hexagon-in2" data-set="i"></div></div></div></div>\
    <div class="key"><div class="hexagon"><div class="hexagon-in1"><div class="hexagon-in2" data-set="iv"></div></div></div></div>\
    <div class="key"><div class="hexagon"><div class="hexagon-in1"><div class="hexagon-in2" data-set="v"></div></div></div></div>\
  ';
  container.appendChild(controlsDiv);
};

var init = function(){
  initSynths();

  current_keys = addOctavesToRows(scales[current_scale_name].rows);

  // Show / hide notation
  $('#controls .note').click(function(){
    if ($(this).hasClass('selected')) {
      // do nothing
    } else { // trigger key switch
      clearKeyboard($('#keys'));
      current_scale_name = $(this).data('set');
      current_keys = addOctavesToRows(scales[current_scale_name].rows);
      initKeyboard(document.getElementById('keys'));
      $('#controls button').removeClass('selected');
      $(this).addClass('selected');
    }
  });

  $('#notation').click(function(){
    $('.key h1').toggle();
  });
};

var clearKeyboard = function(container) {
  container.empty();
}

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
    for (i = 0, l = current_keys.length; i < l; i++) {
      insertRow(i, current_keys[i], container);
    };

    insertControls(i, container);

    if (tallerKeys === true) {
      container.classList.add('tall');
    }

    sizeKeys(container);
    container.style.visibility = "visible";
    window.onresize = function(event) {
      sizeKeys(container);
    }
  }

  initKeyboard(document.getElementById('keys'));

  var keysDown = {};

  var getKeyPressed = function (keyCode) {
    var i, l, j, m, note;
    for (i = 0, l = keyMap.length; i < l; i++) {
      for (j = 0, m = keyMap[i].length; j < m; j++) {
        if (keyCode === keyMap[i][j]) {
          note = current_keys[i][j % notesPerOctave];
          return note;
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
    for (i = 0, l = current_keys.length; i < l; i++) {
      insertRow(i, current_keys[i], container);
    };

    $('#controls').remove();

    insertControls(i, container);

    if (tallerKeys === true) {
      container.classList.add('tall');
    }

    sizeKeys(container);
    container.style.visibility = "visible";
    window.onresize = function(event) {
      sizeKeys(container);
    }
  }

  initKeyboard(document.getElementById('keys'));

  var ongoingTouches = {};
  window.ongoingTouches = ongoingTouches;

  var changeArrangement = function (set) {
    var id2, previousNote, newNote;

    if (set === current_scale_name) return;

    $('#keys').removeClass('a_i a_iv a_v').addClass('a_' + set);

    current_scale_name = set;
    previous_keys = current_keys;
    current_keys = addOctavesToRows(scales[current_scale_name].rows);

    for (id2 in ongoingTouches) {
      previousNote = ongoingTouches[id2].note;
      if (previousNote) {
        stopNote(previousNote);

        newNote = allNotes[ongoingTouches[id2].keyID];

        if (newNote) {
          startNote(newNote);
          ongoingTouches[id2].note = newNote;
        } else {
          delete ongoingTouches[id2];
        }
      }
    }
  };

  $('#keys').on('touchstart touchmove touchend touchcancel touchleave', function (e) {
    e.preventDefault();

    console.log('type', e.type);

    var i,
        touches = e.originalEvent.changedTouches,
        $el,
        keyID,
        note,
        set,
        previousNote,
        col, row,
        newNote, $newEl,
        id,
        id2,
        lastTouch;

    if (e.type === 'touchstart') {
      for (i = 0; i < touches.length; i++) {
        id = touches[i].identifier;
        $el = $(document.elementFromPoint(touches[i].pageX, touches[i].pageY)).closest('.hexagon-in2');
        keyID = $el.data('id');
        if (keyID) note = allNotes[keyID];
        set = $el.data('set');

        ongoingTouches[id] = { $elRemoveClass: $el.removeClass.bind($el), note: note, set: set, keyID: keyID };

        if (note !== void 0) {
          $el.addClass('active');

          startNote(note);
        } else if (set !== void 0) {
          changeArrangement(set);
        }
      }
    } else if (e.type === 'touchmove') {
      for (i = 0; i < touches.length; i++) {
        id = touches[i].identifier;
        lastTouch = ongoingTouches[id];
        if (lastTouch) {
          $el = $(document.elementFromPoint(touches[i].pageX, touches[i].pageY)).closest('.hexagon-in2');
          keyID = $el.data('id');
          if (keyID) note = allNotes[keyID];
          set = $el.data('set');
          if (note !== lastTouch.note) {
            ongoingTouches[id] = { $elRemoveClass: $el.removeClass.bind($el), note: note, keyID: keyID };

            if (lastTouch.$elRemoveClass) {
              lastTouch.$elRemoveClass('active');

              stopNote(lastTouch.note);
            }
            if (note !== void 0) {
              $el.addClass('active');

              startNote(note);
            }
          } else if (note === void 0 && set !== void 0) {
            changeArrangement(set);
          }
        } else {
          console.error('can\'t figure out which touch to continue', id, ongoingTouches);
        }
      }
    } else {
      console.log('touchend', JSON.stringify(ongoingTouches));
      for (i = 0; i < touches.length; i++) {
        id = touches[i].identifier;
        lastTouch = ongoingTouches[id];
        if(lastTouch) {
          delete ongoingTouches[id];
          lastTouch.$elRemoveClass('active');
          var note = lastTouch.note;

          if (note !== void 0) {
            stopNote(note);
          }
          //synth.triggerRelease();
        } else {
          console.error('can\'t figure out which touch to end');
        }
      }
    }
  });

  if (!window.navigator.standalone) {
    $('#hiddenSettings').on('touchend', function (e) {
      e.preventDefault();

      var newAttackTime = window.prompt('attackTime', attackTime);
      if (newAttackTime === null) return;
      attackTime = parseFloat(newAttackTime) || 0.05;

      var newDecayTime = window.prompt('decayTime', decayTime);
      if (newDecayTime === null) return;
      decayTime = parseFloat(newDecayTime) || 0.1;

      var newGainLow = window.prompt('gainLow', gainLow);
      if (newGainLow === null) return;
      gainLow = parseFloat(newGainLow) || 0.25;

      var newGainHigh = window.prompt('gainHigh', gainHigh);
      if (newGainHigh === null) return;
      gainHigh = parseFloat(newGainHigh) || 0.75;
    });
  }

  $('document').on('touchstart touchmove touchend touchcancel touchleave', function (e) {
    alert('d');
    e.preventDefault();
  });
}