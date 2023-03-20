const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
  const synthesizeBtn = document.getElementById('synthesize-btn');
  const inputText = document.getElementById('input-text');
  const voiceSelect = document.getElementById('voice-select');

  synthesizeBtn.addEventListener('click', () => {
    const text = inputText.value;
    const voiceName = voiceSelect.value;
    ipcRenderer.send('synthesize', text, voiceName);
  });
});
