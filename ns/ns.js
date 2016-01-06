/* globals SpeechSynthesisUtterance, speechSynthesis, Tone, TweenLite */

"use strict"

let $ = (selector)=>document.querySelector(selector)
let $$ = (selectors)=>document.querySelectorAll(selectors)
// Never do this!
NodeList.prototype.forEach = function() {[].forEach.apply(this,arguments)}

let notePlayers = {}, master, scale, SCALES, scaleName, volumes, MASTER_VOLUME
let loop, type
let voice
const OCTAVE = 12

function fade(to, duration) {
  return new Promise((res)=> {
    TweenLite.to(volumes, duration, {
      master: to,
      onUpdate() {
        master.setVolume(volumes.master)
      },
      onComplete: res
    })
  })
}

function delay(ms) {
  return new Promise((res)=>setTimeout(res, ms))
}

function playPhrase(text) {
  if (text === '') {
    $('#playingInfo p').innerHTML = '&nbsp;'
    return delay(1000)
  }
  let tospeak = text, todisp = text
  if (typeof text === 'object') {
    todisp = text[0]
    tospeak = text[1]
  }
  $('#playingInfo p').innerText = todisp
  return new Promise((res, rej)=> {
    let utterance = new SpeechSynthesisUtterance();
    utterance.lang = 'en-US';
    utterance.text = tospeak
    if (voice) utterance.voiceURI = voice
    utterance.onend = ()=> {
      res()
    }
    utterance.onerror = rej
    speechSynthesis.speak(utterance);
  })
}

function play(phrases) {
  let p = new Promise((res)=> res())

  for (let phrase of phrases) {
    p = p.then(()=> playPhrase(phrase))
  }

  return p
}


function audioLoop() {
  if (!loop) {
    return;
  }
  switch (type) {
    case 'totalRand':
      let which = scale[Math.floor(Math.random()*scale.length)] +
                  OCTAVE * [-1,0,1,2][Math.floor(4*Math.random())]
      notePlayers[which]()
      break
    case 'chord':
      let whichchord = scale[Math.floor(Math.random()*scale.length)]
      notePlayers[whichchord[0]-OCTAVE](0.75)
      notePlayers[whichchord[0]]()
      notePlayers[whichchord[0]+OCTAVE](0.5)
      notePlayers[whichchord[1]](0.8)
      notePlayers[whichchord[2]-OCTAVE](0.75)
      notePlayers[whichchord[2]](0.8)
  }
  setTimeout(audioLoop, loop)
}

function initAudio() {
  MASTER_VOLUME = -25
  volumes = {
    master: MASTER_VOLUME,
    dip: 15,
    bass: -5
  }

  const TREMOLO = 5
  const DELAY= 0.2
  SCALES = {
    major: [0, 2, 4, 5, 7, 9, 11],
    majorIonly: [0, 4, 7],
    minor: [0, 2, 3, 5, 7, 8, 10],
    minorHarm: [0, 2, 3, 5, 7, 8, 11],
    minorIonly: [0, 3, 7],
    penta: [0, 2, 4, 7, 9],
    chord: [
      [0, 4, 7],
      [2, 5, 9],
      [4, 7, 11],
      [5, 9, 12],
      [7, 11, 14],
      [9, 12, 16]
    ]
  }

  const BASE_FREQUENCY = 261.6

  const noteToFreq = (note)=> Math.pow(2, (note/12))*BASE_FREQUENCY

  // master
  let limiter = new Tone.Limiter(-10)
  limiter.toMaster()

  master = Tone.Master
  master.setVolume(volumes.master)

  let masterDelay = new Tone.PingPongDelay(0.25)
  masterDelay.setWet(DELAY)
  masterDelay.connect(limiter)

  let masterLFO = new Tone.LFO(5, -TREMOLO, TREMOLO)
  masterLFO.start()

  //////

  let drone = new Tone.Oscillator(noteToFreq(-OCTAVE), "triangle")
  drone.setVolume(volumes.bass)
  drone.connect(master)
  drone.start()

  //////

  // |__A__|D|  |_R_|
  // |    /\    |   |
  // |   /  \___|   |
  // |  /     ^ |\  |
  // | /      S | \ |
  // |/_______|_|__\|
  const ATTACK = 0.1
  const DECAY = 0.01
  const SUSTAIN = 0.5
  const RELEASE = 2

  for (let note of [0,1,2,3,4,5,6,7,8,9,10,11]) {
    for (let octaveNote of [-OCTAVE, 0, OCTAVE, 2*OCTAVE]) {
      let noteVal = note + octaveNote

      let osc = new Tone.Oscillator(noteToFreq(noteVal))
      let osc2 = new Tone.Oscillator(noteToFreq(noteVal + OCTAVE))

      let env = new Tone.Envelope(ATTACK, DECAY, SUSTAIN, RELEASE)
      let env2 = new Tone.Envelope(ATTACK, DECAY, SUSTAIN, RELEASE)

      masterLFO.connect(osc.detune)
      masterLFO.connect(osc2.detune)

      env.connect(osc.output.gain)
      env2.connect(osc2.output.gain)

      osc.connect(masterDelay)
      osc2.connect(masterDelay)

      osc.start()
      osc2.start()

      let fire = (velocity)=> {
        velocity = (velocity !== undefined ? velocity : 1)
        env.triggerAttackRelease(env.attack, '+0', velocity)
        env2.triggerAttackRelease(env.attack, '+0', velocity * 0.5)
      }
      notePlayers[noteVal] = fire
      notePlayers[noteVal].env = env
      notePlayers[noteVal].osc = osc
      notePlayers[noteVal].osc2 = osc2
      notePlayers[noteVal].setPrimaryOsc = (shape)=> {
        osc.setType(shape)
      }
      notePlayers[noteVal].setOvertoneOsc = (shape)=> {
        osc2.setType(shape)
      }
    }
  }

  loop = 250
  type = 'totalRand'
  scaleName = 'penta'
  scale = SCALES[scaleName]
  audioLoop()

  window.notePlayers = notePlayers
}

function start() {
  $('body').setAttribute('options', 'closed')
  $('body').setAttribute('page', 'playing')
  $('body').setAttribute('movement', 1)

  $('#audioOptions > h2').addEventListener('click', function() {
    if ($('body').getAttribute('options') === 'closed')
      $('body').setAttribute('options', 'open')
    else
      $('body').setAttribute('options', 'closed')
  })

  $('#playingInfo h1').innerText = 'I'
  $('#playingInfo h2').innerHTML =
    "In Which An Apple Bringeth an Idea Unto Newton's Head" +
    '<div class="sub">text based upon William Stukeley\'s Memoir of Sir Isaac Newton\'s Life</div>'

  delay(250).then(()=> fade(-100, 2)).then(()=> {
    loop = 400
    scaleName = 'minorHarm'
    scale = SCALES[scaleName]

    return fade(MASTER_VOLUME, 2)
  }).then(()=> {
    return play([
      "",
      "after dinner",
      "the weather being warm",
      "we went into the garden",
      ["& drank thea under the shade of some appletrees",
       "and drank tea under the shade of some appletrees"],
      ["only he, & myself.",
       "only he, and myself."],
      "",
      "amidst other discourse, he told me,",
      "he was just in the same situation,",
      "as when formerly,",
      "the notion of gravitation came into his mind.",
      "",
      ["\"why should that apple always descend perpendicularly to the ground,\"",
       "why should that apple always descend perpendicularly to the ground,"],
      "thought he to him self:",
      ["occasion'd by the fall of an apple,",
       "occasioned by the fall of an apple,"],
      "as he sat in a contemplative mood:",
      "",
      ["\"why should it not go sideways, or upwards?",
       "why should it not go sideways, or upwards?"],
      ["but constantly to the earths centre?",
       "but constantly to the earth's center?"],
      "assuredly, the reason is,",
      "that the earth draws it.",
      "there must be a drawing power in matter.",
      ["& the sum of the drawing power in the matter of the earth must be in the earths center,",
       "and the sum of the drawing power in the matter of the earth must be in the earths center,"],
      "not in any side of the earth.",
      ["therefore dos this apple fall perpendicularly,",
       "therefore does this apple fall perpendicularly,"],
      "or toward the center.",
      "",
      "if matter thus draws matter;",
      "it must be in proportion of its quantity.",
      "therefore the apple draws the earth,",
      ["as well as the earth draws the apple.\"",
       "as well as the earth draws the apple."],
      "",
      "and so his laws were born.",
      ""
    ])
  }).then(()=> fade(-100, 2)).then(()=> {
    $('body').setAttribute('movement', 2)
    $('#playingInfo h1').innerText = 'II'
    $('#playingInfo h2').innerHTML =
      "In Which An Object In Motion Doth Stayeth In Motion; And An Object At Rest Doth Stayeth At Rest; If No Net Force Beith Applied To The Object" +
      '<div class="sub">Newton\'s First Law</div>'
    loop = 500
    type = 'chord'
    scaleName = 'chord'
    scale = SCALES[scaleName]

    return fade(MASTER_VOLUME, 2)
  }).then(()=> {
    return play([
      "",
      "consequently it was discovered",
      "that if the net force on an object is zero",
      "that the velocity of that object shall be constant",
      "",
      "that is,",
      "an object that is at rest will stay at rest",
      "and an object that is in motion will not change its state of motion",
      "unless an external force acts upon it.",
      "",
      "this resistance of any physical object to a change in its state of motion",
      "is called inertia",
      "and it is what causes objects to move in a straight line at constant velocity.",
      "",
      "if you have an apple",
      "sitting on the table",
      "it is not in motion,",
      "and it will remain not in motion",
      "until a nonzero net force is effected upon it.",
      "",
      "and if you have put that apple in space",
      "and given the apple a push",
      "it is in motion",
      "and it will remain in motion",
      "until a nonzero net force is effected upon it",
      "",
      "the first law.",
      ""
    ])
  }).then(()=> fade(-100, 2)).then(()=> {
    $('body').setAttribute('movement', 3)
    $('#playingInfo h1').innerText = 'III'
    $('#playingInfo h2').innerHTML =
      "In Which The Acceleration Of An Object Beith Directly Proportional To Thine Net Force, And Inversely Proportional To Thine Mass" +
      '<div class="sub">Newton\'s Second Law</div>'

    return fade(MASTER_VOLUME, 2)
  }).then(()=> {
    return play([
      "",
      "consequently it was discovered",
      "that the acceleration of an object",
      "shall be directly proportional to its net force",
      "and inversely proportional to its mass.",
      "",
      "that is,",
      "for two objects, upon which the same force has been exerted,",
      "the less massive will accelerate more quickly",
      "and an apple, falling to the earth",
      "will fall with less force than another apple with greater mass.",
      "",
      "the net force on an object produces a proportional acceleration",
      "and if an object is accelerating",
      "there must be a force on it.",
      "",
      "if you have an apple",
      "sitting on the table",
      "and you give it a push,",
      "it will accelerate forward",
      "to an extent proportional to that of the push",
      "",
      "and if you were to push a larger apple",
      "it would take a greater force",
      "to produce the same acceleration.",
      "",
      "the second law.",
      ""
    ])
  }).then(()=> fade(-100, 2)).then(()=> {
    $('body').setAttribute('movement', 4)
    $('#playingInfo h1').innerText = 'IV'
    $('#playingInfo h2').innerHTML =
      "In Which There Beith For Each Action An Equal And Opposite Reaction" +
      '<div class="sub">Newton\'s Third Law</div>'

    return fade(MASTER_VOLUME, 2)
  }).then(()=> {
    return play([
      "",
      "consequently it was discovered",
      "that all forces between two objects",
      "exist in equal magnitude and opposite direction.",
      "",
      "that is,",
      "for any action that ever will be or ever has been,",
      "there is an equal and opposite reaction",
      "and these two forces are simultaneous",
      "in one single interaction.",
      "",
      "there will never be a unidirectional force",
      "or a force which only acts on one object",
      "because this law of the universe forbids it.",
      "",
      "when you throw an apple",
      "the apple throws back, too.",
      "there is an equal and opposite reaction",
      "which is applied to you.",
      "",
      "the mutual forces on two bodies are always equal",
      "the apparent changes may not be;",
      "but the forces are always the same.",
      "",
      "the third law.",
      ""
    ])
  }).then(()=> fade(-100, 2)).then(()=> {
    $('body').setAttribute('movement', 5)
    $('#playingInfo h1').innerText = 'V'
    $('#playingInfo h2').innerHTML =
      "In Which These Laws Beith Still Important Today"

    loop = 300
    type = 'totalRand'
    scaleName = 'major'
    scale = SCALES[scaleName]

    return fade(MASTER_VOLUME, 2)
  }).then(()=> {
    return play([
      "",
      "still today",
      "these three laws reign true",
      "tested throughout the universe.",
      "in everything we do.",
      "",
      "every interaction with the world",
      "is governed by these laws.",
      "every person, planet, everything:",
      "they always play by the rules...",
      "the rules of the universe.",
      "",
      "still today",
      "these three laws reign true",
      "tested throughout the universe.",
      "in everything we do.",
      "",
      ""
    ])
  }).then(()=> fade(-100, 2)).then(()=> {
    $('body').removeAttribute('movement')
    $('body').setAttribute('page', 'start')
    loop = 250
    scaleName = 'penta'
    scale = SCALES[scaleName]

    return fade(MASTER_VOLUME, 2)
  })
}

function init() {
  if (!window.speechSynthesis) {
    $('#startBtn').classList.add('error')
    $('#startBtn').innerHTML = 'Error!'
    alert('Your OS or browser does not support speech synthesis.')
    return
  }

  if (speechSynthesis.getVoices().some((a)=>a.name === 'Google US English'))
    voice = 'Google US English'

  initAudio()

  // settings stuff
  {
    let next = (current)=> {
      switch (current) {
        case 'sine':
          return 'triangle'
        case 'triangle':
          return 'square'
        case 'square':
          return 'sawtooth'
        case 'sawtooth':
        /* falls through */
        default:
          return 'sine'
      }
    }
    $$('[shape-control]').forEach((elem)=> {
      elem.addEventListener('click', ()=> {
        let shape = next(elem.getAttribute('shape'))
        elem.setAttribute('shape', shape)
        for (let playerName of Object.keys(notePlayers)) {
          notePlayers[playerName][`set${elem.id==='shapeUnder'?'Primary':'Overtone'}Osc`](shape)
        }
      })
    })
    $('#speechTest').addEventListener('click', ()=> {
      let utterance = new SpeechSynthesisUtterance();
      utterance.lang = 'en-US';
      utterance.text = [
        'Hello there!',
        'It seems to be working...',
        'Testing, one two three',
        'Everything\'s ready to go.',
        'Can you hear my voice?',
        'Most people recognize me by my voice.'
      ][Math.floor(Math.random()*6)]
      if (voice) utterance.voiceURI = voice
      speechSynthesis.speak(utterance);
    })
  }

  $('#startBtn').addEventListener('click', start)

  // once we're done...
  $('body').removeAttribute('loading')
  $('#startBtn').removeAttribute('disabled')
  $('#startBtn').innerText = 'START'
}

init()