const { ipcRenderer, remote} = require('electron');

document.addEventListener('DOMContentLoaded', (event) => {

//text log
  let username;

function handleLogin(user) {
  username = user.username;
  loadLog(); 
}

let log;

function saveToLog(input) {
  log.push({text: input, date: new Date()});
  ipcRenderer.send('save-log', log);
  
  let saveNotification = document.getElementById('save-notification');
  saveNotification.style.display = 'inline'; 
  setTimeout(() => {
    saveNotification.style.display = 'none';
  }, 2000);
}

function loadLog() {
  ipcRenderer.send('load-log');
}

function importFromLog() {
  try {
    let selectedItem = document.getElementById('log-table').querySelector('tr.selected');
    if (selectedItem) {
      ipcRenderer.send('import-log', selectedItemIndex);
    }
  } catch (error) {
    console.error('Error importing from log:', error);
  }
}

ipcRenderer.on('import-log-reply', (event, arg) => {
  try {
    document.getElementById('input-text').value = arg.text;
  } catch (error) {
    console.error('Error setting input text:', error);
  }
});

let selectedItemIndex;

function handleRowClick(event) {
  let rows = document.getElementById('log-table').querySelectorAll('tr');
  rows.forEach(row => row.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
  selectedItemIndex = Array.from(event.currentTarget.parentNode.children).reverse().indexOf(event.currentTarget);
  document.getElementById('import-button').style.display = 'block';
  document.getElementById('delete-button').style.display = 'block';
}

function deleteFromLog() {
  let selectedItem = document.getElementById('log-table').querySelector('tr.selected');
  if (selectedItem) {
    ipcRenderer.send('delete-log', selectedItemIndex);
    selectedItem.classList.remove('selected');
    document.getElementById('import-button').style.display = 'none';
    document.getElementById('delete-button').style.display = 'none';
  }
}

ipcRenderer.on('delete-log-reply', (event, arg) => {
  log = arg;
  loadLog(); 
});

function handleConfirmDelete() {
  if (confirm("Er du sikker på at du vil slette denne oppføringen?")) {
  }
  closeConfirmationModal();
}

function openConfirmationModal() {
  let selectedItem = document.getElementById('log-table').querySelector('tr.selected');
  if (selectedItem) {
    selectedItem.classList.add('confirmed-delete');
  }

  let confirmationModal = document.getElementById('confirmation-modal');
  confirmationModal.style.display = 'block';

  let confirmDeleteButton = document.getElementById('confirm-delete-button');
  let cancelDeleteButton = document.getElementById('cancel-delete-button');

  confirmDeleteButton.addEventListener('click', handleConfirmDelete);
  cancelDeleteButton.addEventListener('click', handleCancelDelete);
}


function closeConfirmationModal() {
  let confirmationModal = document.getElementById('confirmation-modal');
  confirmationModal.style.display = 'none';

  let confirmDeleteButton = document.getElementById('confirm-delete-button');
  let cancelDeleteButton = document.getElementById('cancel-delete-button');

  confirmDeleteButton.removeEventListener('click', handleConfirmDelete);
  cancelDeleteButton.removeEventListener('click', handleCancelDelete);
}

function handleCancelDelete() {
  closeConfirmationModal();
}
document.getElementById('search-button').addEventListener('click', () => {
  let searchTerm = document.getElementById('search-input').value.toLowerCase();
  let filteredLog = log.filter(item => item.text.toLowerCase().includes(searchTerm));
  updateLogTable(filteredLog);
});


function updateLogTable(log) {
  let logTable = document.getElementById('log-table');
  logTable.innerHTML = '';
  log.forEach((item, index) => {
    let tr = document.createElement('tr');
    tr.dataset.item = JSON.stringify(item);
    let tdText = document.createElement('td');
    tdText.textContent = item.text;
    tr.appendChild(tdText);
    let tdDate = document.createElement('td');
    tdDate.textContent = new Date(item.date).toLocaleString();
    tr.appendChild(tdDate);
    tr.addEventListener('click', handleRowClick);
    tr.addEventListener('dblclick', importFromLog);
    logTable.prepend(tr);
  });
}

function loadLog() {
  ipcRenderer.send('load-log');
}

ipcRenderer.on('load-log-reply', (event, arg) => {
  log = arg;
  updateLogTable(log);
});


  let isAuthenticated = false;

  // function for updating auth-button
  function updateAuthButton(username) {
    const authButton = document.getElementById('auth-button');
    const userNameDiv = document.getElementById('user-name');
  
    if (username) {
        authButton.textContent = 'Log Out';
        userNameDiv.textContent = username;
    } else {
        authButton.textContent = 'Log In';
        userNameDiv.textContent = '';
    }
}

ipcRenderer.on('msal:loginSuccess', handleResponse);

function handleResponse(event, response) {
  if (response.account && response.account.username) {
    isAuthenticated = true;
    updateAuthButton(response.account.username);
    handleLogin(response.account); 
  } else if (response && response.error) {
    console.log('Error:', response.error);
    ipcRenderer.send('msal:loginFailure', response.error);
  }
}

  

ipcRenderer.on('msal:signOut', () => {
  isAuthenticated = false; 
  updateAuthButton(null); 
  signIn();  // Initiate a new sign-in process
});


  // Get a reference to the button
  const authButton = document.getElementById('auth-button');

  // When the auth button is clicked
  authButton.addEventListener('click', () => {
    if (authButton.textContent === 'Log In') {
      ipcRenderer.send('signIn');
    } else {
      ipcRenderer.send('signOut');
    }
  });

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
  const modal = document.getElementById("Bekreft");
  const yesButton = document.getElementById("yesButton");
  const noButton = document.getElementById("noButton");
  const span = document.getElementsByClassName("close")[0];

  // Event listener for hamburger menu click
  document.getElementById('hamburger-menu').addEventListener('click', (event) => {
    event.stopPropagation();
    const overlay = document.getElementById('overlay');
    if (overlay.style.left === '-250px' || overlay.style.left === '') {
        overlay.style.left = '0px';
        document.body.classList.add('overlay-open');
    } else {
        overlay.style.left = '-250px';
        document.body.classList.remove('overlay-open');
    }
});

document.body.addEventListener('click', () => {
    const overlay = document.getElementById('overlay');
    if (document.body.classList.contains('overlay-open')) {
        overlay.style.left = '-250px';
        document.body.classList.remove('overlay-open');
    }
});


document.getElementById('overlay').addEventListener('click', (event) => {
    event.stopPropagation();
});


document.getElementById('About').addEventListener('click', (event) => {
  event.stopPropagation();
  document.getElementById('about-modal').style.display = 'block';
});

document.getElementById('close-about-modal').addEventListener('click', () => {
  document.getElementById('about-modal').style.display = 'none';
});


document.getElementById('save-to-log-btn').addEventListener('click', () => {
  saveToLog(document.getElementById('input-text').value);
});

document.getElementById('log-menu-btn').addEventListener('click', () => {
  document.getElementById('log-modal').style.display = 'block';
  loadLog(); 
});

document.getElementById('check-for-updates').addEventListener('click', () => {
  ipcRenderer.send('check-for-updates');
});


document.getElementById('log-modal').querySelector('.close').addEventListener('click', () => {
  document.getElementById('log-modal').style.display = 'none';
});

document.getElementById('log-modal').addEventListener('click', (event) => {
  let previouslySelectedItem = document.getElementById('log-modal').querySelector('li.selected');
  if (previouslySelectedItem) {
    previouslySelectedItem.classList.remove('selected');
  }
  if (event.target.tagName === 'LI') {
    event.target.classList.add('selected');
  }
});

document.getElementById('import-button').addEventListener('click', () => {
  let selectedRow = document.querySelector('#log-table tr.selected');
  if (selectedRow) {
    importFromLog();
    document.getElementById('log-modal').style.display = 'none';
  }
});

document.getElementById('delete-button').addEventListener('click', openConfirmationModal);
document.getElementById('confirm-delete-button').addEventListener('click', deleteFromLog);



document.getElementById('log-menu-btn').addEventListener('click', () => {
  document.getElementById('log-modal').style.display = 'block';
  document.body.classList.add('modal-open');
  loadLog(); 
});

document.getElementById('log-modal').querySelector('.close').addEventListener('click', () => {
  document.getElementById('log-modal').style.display = 'none';
  document.body.classList.remove('modal-open');
});

  
  // modal's behavior
  ipcRenderer.on('showLogoutModal', () => {
    modal.style.display = "block";
  });

  yesButton.onclick = function() {
    ipcRenderer.send('dialogResponse', 'yes');
    modal.style.display = "none";
  }

  noButton.onclick = function() {
    ipcRenderer.send('dialogResponse', 'no');
    modal.style.display = "none";
  }

  span.onclick = function() {
    modal.style.display = "none";
  }

  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }

    // Event listener for showing the loading wheel
  ipcRenderer.on('loading:show', () => {
    document.getElementById('loading-wheel').style.display = 'block';
  });

  // Event listener for hiding the loading wheel
  ipcRenderer.on('loading:hide', () => {
    document.getElementById('loading-wheel').style.display = 'none';
  });

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
      template1: `<mstts:silence type="comma-exact" value="300ms"/><mstts:silence type="semicolon-exact" value="400ms"/><mstts:silence type="enumerationcomma-exact" value="500ms"/><mstts:silence type="period" value="600ms"/>`,
      template2: `<mstts:silence type="comma-exact" value="200ms"/><mstts:silence type="semicolon-exact" value="300ms"/><mstts:silence type="enumerationcomma-exact" value="400ms"/>`,
      template3: `<mstts:silence type="comma-exact" value="100ms"/><mstts:silence type="semicolon-exact" value="200ms"/><mstts:silence type="enumerationcomma-exact" value="300ms"/>`
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

  // synthesizeText function:
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

  // Event listeners for inserting SSML
  
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