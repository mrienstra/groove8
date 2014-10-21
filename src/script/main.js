/* globals Tone, GUI, QwertyHancock */

var synth = new Tone.FMSynth();
synth.setVolume(-10);
synth.toMaster();

// GUI //

new GUI.TopBar(Tone);

$("#tabs").tabs();

var content = $("#Content");
var filter0 = $("#filter0");
var filter1 = $("#filter1");
var presets = $("#presets");

//filt 0
var min = 20;
var max = 20000;
var filtEnv0 =new GUI.Envelope(filter0, synth.carrier.filterEnvelope, "filter");
var minFilFreq0 = new GUI.Slider(filter0, function(val){
  var freq = Math.pow(val, 2);
  var scaled = freq * (max - min) + min;
  synth.carrier.filterEnvelope.min = scaled;
  return scaled;
}, min, "start freq", "hz");
var maxFilFreq0 = new GUI.Slider(filter0, function(val){
  var freq = Math.pow(val, 2);
  var scaled = freq * (max - min) + min;
  synth.carrier.filterEnvelope.max = scaled;
  return scaled;
}, min, "end freq", "hz");

//filt 1
var filtEnv1 =new GUI.Envelope(filter1, synth.modulator.filterEnvelope, "filter");
var minFilFreq1 = new GUI.Slider(filter1, function(val){
  var freq = Math.pow(val, 2);
  var scaled = freq * (max - min) + min;
  synth.modulator.filterEnvelope.min = scaled;
  return scaled;
}, min, "start freq", "hz");
var maxFilFreq1 = new GUI.Slider(filter1, function(val){
  var freq = Math.pow(val, 2);
  var scaled = freq * (max - min) + min;
  synth.modulator.filterEnvelope.max = scaled;
  return scaled;
}, min, "end freq", "hz");

//global
var harmonicity = new GUI.Slider(presets, function(val){
  var scaled =  val * 10;
  synth.setHarmonicity(scaled);
  return scaled;
}, 1, "harmonicity");
var modulationIndex = new GUI.Slider(presets, function(val){
  synth.setModulationIndex(val * 50);
  return val * 50;
}, 1, "modulation index");
var allPresets = [];
for (var name in synth.preset){
  allPresets.push(name);
}
$("<div>", {"id" : "PresetText"}).appendTo(presets).text("presets:");
new GUI.DropDown(presets, allPresets, function(name){
  setPreset(name);
});

//keyboard
$("<div>", {"id" : "Keyboard"}).appendTo(content);
var keyboard = new QwertyHancock({
  id: "Keyboard",
  width: 400,
  height: 75,
  octaves: 3,
  startNote: "A2",
});
keyboard.keyDown = function(note, freq){
  synth.triggerAttack(freq);
};
keyboard.keyUp = function(){
  synth.triggerRelease();
};

function setPreset(name){
  synth.setPreset(name);
  var preset = synth.preset[name];
  filtEnv0.render();
  var minVal0 = Math.pow(Math.max((preset.carrier.filterEnvelope.min - min) / (max - min), 0), 0.5);
  minFilFreq0.render(minVal0);
  var maxVal0 = Math.pow(Math.max((preset.carrier.filterEnvelope.max - min) / (max - min), 0), 0.5);
  maxFilFreq0.render(maxVal0);
  filtEnv1.render();
  var minVal1 = Math.pow(Math.max((preset.modulator.filterEnvelope.min - min) / (max - min), 0), 0.5);
  minFilFreq1.render(minVal1);
  var maxVal1 = Math.pow(Math.max((preset.modulator.filterEnvelope.max - min) / (max - min), 0), 0.5);
  maxFilFreq1.render(maxVal1);	
  harmonicity.render(preset.harmonicity / 10);
  modulationIndex.render(preset.modulationIndex / 50);		
}

setPreset("Koto");