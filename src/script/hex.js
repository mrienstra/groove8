// Globals
var rows = [
  ['Db', 'Eb', 'Gb', 'Bb'],
  ['D', 'F', 'Ab', 'B'],
  ['C', 'E', 'G', 'A']
];
var keyMap = [
  [87, 69, 82, 84, 89, 85, 73, 79],
  [83, 68, 70, 71, 72, 74, 75, 76],
  [90, 88, 67, 86, 66, 78, 77, 188]
];
var startingOctave = 2;
var notesPerOctave = 4;
var keysPerRow = 9;
var synths = [];
var synthCount = 10;



// Functions
var initSynths = function(){
  var i, synth;
  for (i = 0; i < synthCount; i++) {
    synth = new Tone.FMSynth();
    synth.setVolume(-10);
    synth.toMaster();
    synths[i] = {
      synth: synth,
      note: null
    };
  }
};

var startNote = function (note) {
  console.log('startNote', note);
  var i;

  for (i = 0; i < synthCount; i++) {
    if (synths[i].note === note) {
      break;
    } else if (!synths[i].note) {
      synths[i].note = note;
      synths[i].synth.triggerAttack(getNoteFrequency(note));
      break;
    }
  }
};
var stopNote = function (note) {
  console.log('stopNote', note);
  var i;

  for (i = 0; i < synthCount; i++) {
    if (synths[i].note === note) {
      synths[i].note = null;
      synths[i].synth.triggerRelease();
      break;
    }
  }
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

initSynths();

// Show / hide notation
$('#notation').click(function(){
  $('.key h1').toggle();
});

$('#keys').on('mousedown', '.hexagon-in2', function(){
  $('.hexagon-in2').removeClass('active');
  $(this).addClass('active');
  startNote($(this).data('note'));
});
$('#keys').on('mouseup', '.hexagon-in2', function(){
  $('.hexagon-in2').removeClass('active');
  stopNote($(this).data('note'));
});

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
        $('.hexagon-in2').removeClass('active');
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
        }
        if (note !== lastTouch.note && note !== void 0) {
          $el.addClass('active');

          stopNote(note);
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

    //playChord();
  });
}

var playChord = function () {
  var freqs = [69.29565774421802, 77.78174593052023, 92.4986056779086, 116.54094037952248, 138.59131548843604, 155.56349186104046, 184.9972113558172, 233.08188075904496, 277.1826309768721, 73.41619197935188, 87.30705785825097, 103.82617439498628, 123.47082531403103, 146.8323839587038, 174.61411571650194, 207.65234878997256, 246.94165062806206, 293.6647679174076, 65.40639132514966, 82.4068892282175, 97.99885899543733, 110, 130.8127826502993, 164.81377845643496, 195.99771799087463, 220, 261.6255653005986];
  var synths = [];
  var i = 0, l = freqs.length;
  var n = 4;
  var id = window.setInterval(function(){
    if (i < n) {
      synths[i] = new Tone.FMSynth();
      synths[i].setVolume(-10);
      synths[i].toMaster();
      synths[i].triggerAttack(freqs[i]);
    } else {
      synths[i % n].triggerRelease();
      var j = i;
      window.setTimeout(function(){ synths[j % n].triggerAttack(freqs[j % l]); }, 0);
    }
    i++;
  }, 2000);
};

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