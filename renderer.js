const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
  const synthesizeBtn = document.getElementById('synthesize-btn');
  const playRecordingBtn = document.getElementById('play-recording-btn');
  const inputText = document.getElementById('input-text');
  const voiceSelect = document.getElementById('voice-select');
  const pitchSlider = document.getElementById('pitch-slider');
  const speedSlider = document.getElementById('speed-slider');
  const ssmlOutput = document.getElementById('ssml-output');

  let audioData = null;

  function updateSSML(text) {
    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
      <voice name="${voiceSelect.value}">
        <prosody pitch="${(pitchSlider.value - 1) * 100}%" rate="${speedSlider.value}x">
          ${text}
        </prosody>
      </voice>
    </speak>`;

    ssmlOutput.value = ssml;
  }

  function updateSynthesizeButton() {
    synthesizeBtn.disabled = inputText.value.trim() === "";
  }

  function synthesizeText(text, voiceName, pitch, speed, saveToFile = false, playAudio = true) {
    ipcRenderer.send('synthesize', text, voiceName, pitch, speed);
    ipcRenderer.once('synthesize:done', (event, receivedAudioData) => {
      audioData = receivedAudioData;
  
      if (playAudio) {
        const audio = new Audio();
        audio.src = URL.createObjectURL(new Blob([audioData], { type: 'audio/wav' }));
        audio.onended = () => {
          URL.revokeObjectURL(audio.src);
          playRecordingBtn.disabled = false;
        };
        audio.play();
        playRecordingBtn.disabled = true;
      }
  
      if (saveToFile) {
        ipcRenderer.send('save-audio-file', audioData);
      }
    });
  }

  function insertSSMLTag(tag) {
    const inputTextElement = document.getElementById('input-text');
    const cursorPosition = inputTextElement.selectionStart;
  
    const beforeCursor = inputTextElement.value.substring(0, cursorPosition);
    const afterCursor = inputTextElement.value.substring(cursorPosition);
  
    inputTextElement.value = `${beforeCursor}${tag}${afterCursor}`;
    inputTextElement.focus();
    inputTextElement.selectionEnd = cursorPosition + tag.length;
  
    updateSSML(inputTextElement.value);
  }
  
  inputText.addEventListener('input', () => {
    updateSSML(inputText.value);
    updateSynthesizeButton();
  });

  pitchSlider.addEventListener('input', () => {
    updateSSML(inputText.value);
  });

  speedSlider.addEventListener('input', () => {
    updateSSML(inputText.value);
  });

  playRecordingBtn.addEventListener('click', () => {
    const text = inputText.value;
    const pitch = (pitchSlider.value - 1) * 100;
    const speed = speedSlider.value;
    synthesizeText(text, voiceSelect.value, pitch, speed);
  });

  synthesizeBtn.addEventListener('click', () => {
    const text = inputText.value;
    const pitch = (pitchSlider.value - 1) * 100;
    const speed = speedSlider.value;
    synthesizeText(text, voiceSelect.value, pitch, speed, true, false);
  });

  document.getElementById('btn-none').addEventListener('click', () => {
    insertSSMLTag('<mstts:ttsbreak strength="none" />');
  });
  
  document.getElementById('btn-100ms').addEventListener('click', () => {
    insertSSMLTag('<break time="100ms" />');
  });
  
  document.getElementById('btn-x-weak').addEventListener('click', () => {
    insertSSMLTag('<break strength="x-weak" />');
  });
  
  document.getElementById('btn-weak').addEventListener('click', () => {
    insertSSMLTag('<break strength="weak" />');
  });
  
  document.getElementById('btn-medium').addEventListener('click', () => {
    insertSSMLTag('<break strength="medium" />');
  });
  
  document.getElementById('btn-strong').addEventListener('click', () => {
    insertSSMLTag('<break strength="strong" />');
  });
  
  document.getElementById('btn-x-strong').addEventListener('click', () => {
    insertSSMLTag('<break strength="x-strong" />');
  });
  
  updateSynthesizeButton();

});
