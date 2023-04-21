// Import ipcRenderer from electron to enable communication between the main process and renderer process
const { ipcRenderer } = require('electron');

// Event listener for showing the loading wheel
ipcRenderer.on('loading:show', () => {
  document.getElementById('loading-wheel').style.display = 'block';
});

// Event listener for hiding the loading wheel
ipcRenderer.on('loading:hide', () => {
  document.getElementById('loading-wheel').style.display = 'none';
});

// Event listener for when the DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {

  // Declare and initialize DOM elements
  const synthesizeBtn = document.getElementById('synthesize-btn');
  const playRecordingBtn = document.getElementById('play-recording-btn');
  const inputText = document.getElementById('input-text');
  const voiceSelect = document.getElementById('voice-select');
  const pitchSlider = document.getElementById('pitch-slider');
  const speedSlider = document.getElementById('speed-slider');
  const ssmlOutput = document.getElementById('ssml-output');
  const insertEmailButton = document.getElementById('insert-email');
  const emailInput = document.getElementById('email-input');
  const textInput = document.getElementById('input-text');
  const insertPhoneButton = document.getElementById('insert-phone');
  const phoneInput = document.getElementById('phone-input');
  const emailOverlay = document.getElementById('email-overlay');
  const phoneOverlay = document.getElementById('phone-overlay');
  const emailInsertButton = document.getElementById('email-insert-button');
  const emailCancelButton = document.getElementById('email-cancel-button');
  const phoneInsertButton = document.getElementById('phone-insert-button');
  const phoneCancelButton = document.getElementById('phone-cancel-button');
  const stopRecordingBtn = document.getElementById('stop-recording-btn');
  const pauseRecordingBtn = document.getElementById('pause-recording-btn');


  

  // Event listener for showing the phone overlay
  insertPhoneButton.addEventListener('click', () => {
    phoneOverlay.classList.remove('hidden');
  });

  // Event listener for showing the email overlay
  insertEmailButton.addEventListener('click', () => {
    emailOverlay.classList.remove('hidden');
  });

  // Event listener for inserting the email as SSML
  emailInsertButton.addEventListener('click', () => {
    const email = emailInput.value;

    if (email) {
      const spelledOutEmail = spellOutEmailNorwegian(email);
      const wrappedEmail = `<say-as interpret-as="e-mail">${email}</say-as>`;
      const textInputValue = textInput.value;
      textInput.value = textInputValue + wrappedEmail;
      emailInput.value = '';
    }

    emailOverlay.classList.add('hidden');
  });

  // Event listener for canceling email insertion
  emailCancelButton.addEventListener('click', () => {
    emailInput.value = '';
    emailOverlay.classList.add('hidden');
  });

  // Event listener for inserting the phone number as SSML
  phoneInsertButton.addEventListener('click', () => {
    const phone = phoneInput.value;

    if (phone) {
      const wrappedPhone = `<say-as interpret-as="telephone">${phone}</say-as>`;
      const textInputValue = textInput.value;
      textInput.value = textInputValue + wrappedPhone;
      phoneInput.value = '';
    }

    phoneOverlay.classList.add('hidden');
  });

  // Event listener for canceling phone number insertion
  phoneCancelButton.addEventListener('click', () => {
    phoneInput.value = '';
    phoneOverlay.classList.add('hidden');
  });

  // Initialize audio data variable
  let audioData = null;
  let audio = null;

  // Function for getting the template content
  function getTemplateContent() {
    
    // Get the selected template
    const selectedTemplate = document.getElementById('ssml-template-select').value;

    // SSML templates
    const templates = {
      template1: `<mstts:silence type="comma-exact" value="100ms"/><mstts:silence type="semicolon-exact" value="200ms"/><mstts:silence type="enumerationcomma-exact" value="300ms"/>`,
      template2: `<mstts:silence type="comma-exact" value="200ms"/><mstts:silence type="semicolon-exact" value="300ms"/><mstts:silence type="enumerationcomma-exact" value="400ms"/>`,
      template3: `<mstts:silence type="comma-exact" value="300ms"/><mstts:silence type="semicolon-exact" value="400ms"/><mstts:silence type="enumerationcomma-exact" value="500ms"/>`
    };
  
  // Get the selected template content
    const templateContent = templates[selectedTemplate];

    return templates[selectedTemplate];
  }

  function updateSSML(text) {
    const templateContent = getTemplateContent();
  
    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
      <voice name="${voiceSelect.value}">
        <prosody pitch="${(pitchSlider.value - 1) * 100}%" rate="${speedSlider.value}x">
          ${templateContent}
          ${text}
        </prosody>
      </voice>
    </speak>`;
  
    ssmlOutput.value = ssml;
  }

  // Function for updating the state of the synthesize button
  function updateSynthesizeButton() {
    synthesizeBtn.disabled = inputText.value.trim() === "";
  }

// Function for synthesizing text, playing and saving audio
function synthesizeText(text, voiceName, pitch, speed, templateContent, saveToFile = false, playAudio = true) {
  ipcRenderer.send('synthesize', text, voiceName, pitch, speed, templateContent);
  
  ipcRenderer.once('synthesize:done', (event, receivedAudioData) => {
    audioData = receivedAudioData;

  // Modify this block of code in the synthesizeText function:
if (playAudio) {
  audio = new Audio();
  audio.src = URL.createObjectURL(new Blob([audioData], { type: 'audio/wav' }));
  audio.onended = () => {
    URL.revokeObjectURL(audio.src);
    playRecordingBtn.disabled = false;
    stopRecordingBtn.disabled = true;
    pauseRecordingBtn.disabled = true;
  };
  audio.play();
  playRecordingBtn.disabled = true;
  stopRecordingBtn.disabled = false;
  pauseRecordingBtn.disabled = false;
}


    if (saveToFile) {
      ipcRenderer.send('save-audio-file', audioData);
    }
  });

  ipcRenderer.once('synthesize:error', (event, errorMessage) => {
    showErrorDialog(errorMessage);
  });

}

// Function for displaying error dialog
function showErrorDialog(errorMessage) {
  // Check if an error modal already exists
  const existingModal = document.querySelector('.error-modal');
  if (existingModal) {
    // If an error modal already exists, update its content with the new error message
    existingModal.querySelector('p').textContent = errorMessage;
    return;
  }

  const modal = document.createElement('div');
  modal.classList.add('error-modal');
  modal.innerHTML = `
    <div class="error-modal-content">
      <h2>Feil</h2>
      <p>${errorMessage}</p>
      <button id="copy-error-btn">Kopier feilmelding</button>
      <button id="close-error-btn">Avbryt</button>
    </div>
  `;
  document.body.appendChild(modal);

// Function for copying error message
function copyErrorMessage() {
  navigator.clipboard.writeText(errorMessage)
    .then(() => {
      console.log('Error message copied to clipboard');

      // Display the message under the error
      const copyMessage = document.createElement('p');
      copyMessage.textContent = 'Feilmeldingen er kopiert til utklippstavlen';
      copyMessage.style.marginTop = '30px';
      copyMessage.style.color = 'yellow';
      modal.querySelector('.error-modal-content').appendChild(copyMessage);

      // Remove the message after a few seconds
      setTimeout(() => {
        modal.querySelector('.error-modal-content').removeChild(copyMessage);
      }, 3000);
    })
    .catch(err => {
      console.error('Could not copy text: ', err);
    });
}

  // Function for closing error modal
  function closeErrorModal() {
    const modal = document.querySelector('.error-modal');
    if (modal) {
      document.body.removeChild(modal);
    }
  }

  // Add event listeners to modal buttons
  const copyErrorBtn = modal.querySelector('#copy-error-btn');
  const closeErrorBtn = modal.querySelector('#close-error-btn');

  copyErrorBtn.addEventListener('click', copyErrorMessage);
  closeErrorBtn.addEventListener('click', closeErrorModal);
}

  // Function for inserting SSML tags at the cursor position
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
  
  // Event listeners for updating SSML and the synthesize button on input
  inputText.addEventListener('input', () => {
    updateSSML(inputText.value);
    updateSynthesizeButton();
  });

  pitchSlider.addEventListener('input', () => {    updateSSML(inputText.value);
  });

  speedSlider.addEventListener('input', () => {
    updateSSML(inputText.value);
  });


// Event listener for the play recording button
playRecordingBtn.addEventListener('click', () => {
  const text = inputText.value;
  const pitch = (pitchSlider.value - 1) * 100;
  const speed = speedSlider.value;
  const templateContent = getTemplateContent();
  synthesizeText(text, voiceSelect.value, pitch, speed, templateContent);
});

// Event listener for the Stop button
stopRecordingBtn.addEventListener('click', () => {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
    playRecordingBtn.disabled = false;
    stopRecordingBtn.disabled = true;
  }
});

// Event listener for the pause button
pauseRecordingBtn.addEventListener('click', () => {
  if (audio) {
    if (audio.paused) {
      audio.play();
      pauseRecordingBtn.textContent = 'Pause';
      playRecordingBtn.disabled = true;
    } else {
      audio.pause();
      pauseRecordingBtn.textContent = 'Fortsett';
      playRecordingBtn.disabled = false;
    }
  }
});


  // Event listener for the synthesize button
  synthesizeBtn.addEventListener('click', () => {
    const text = inputText.value;
    const pitch = (pitchSlider.value - 1) * 100;
    const speed = speedSlider.value;
    const templateContent = getTemplateContent();
    synthesizeText(text, voiceSelect.value, pitch, speed, templateContent, true, false);
  });

  // Event listeners for inserting SSML break tags
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

//event listener for the template selection dropdown
  document.getElementById('ssml-template-select').addEventListener('change', () => {
    updateSSML(inputText.value);
  });
  
  //function for spelling out email
  function spellOutEmailNorwegian(email) {
    return email.split('').map(char => (char === '@' ? ' alfakrøll ' : (char === '.' ? ' punktum ' : char))).join(' ');
  }
  

  // Initialize the synthesize button state
  updateSynthesizeButton();

});


