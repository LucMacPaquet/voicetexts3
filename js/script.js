// Configurer AWS
AWS.config.update({
    region: 'us-east-1', // Remplacez par la région de votre bucket
    credentials: new AWS.Credentials('ASIAWQC5JXED6UDUA7RZ', 'AWS_SECRET_ACCESS_KEY="LruKr3xl2m58xxagSBpw9svthSR9t4dS13LKgvtp"')
});

const s3 = new AWS.S3();

const recordButton = document.getElementById('recordButton');
const statusLabel = document.getElementById('statusLabel');
const transcriptionElement = document.getElementById('transcription');

let recognition;

if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'fr-FR';

    recognition.onstart = () => {
        statusLabel.textContent = 'Enregistrement en cours...';
        recordButton.textContent = 'Arrêter';
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                const transcript = event.results[i][0].transcript;
                transcriptionElement.textContent += transcript + ' ';
                uploadToS3(transcript);
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        transcriptionElement.textContent = interimTranscript;
    };

    recognition.onerror = (event) => {
        console.error('Erreur de reconnaissance vocale:', event.error);
        statusLabel.textContent = 'Erreur de reconnaissance vocale';
        recordButton.textContent = 'Enregistrer';
    };

    recognition.onend = () => {
        statusLabel.textContent = 'Enregistrement terminé';
        recordButton.textContent = 'Enregistrer';
    };
} else {
    statusLabel.textContent = 'La reconnaissance vocale n\'est pas supportée sur ce navigateur.';
}

recordButton.addEventListener('click', () => {
    if (recordButton.textContent === 'Enregistrer') {
        startRecording();
    } else {
        stopRecording();
    }
});

function startRecording() {
    if (recognition) {
        recognition.start();
    }
}

function stopRecording() {
    if (recognition) {
        recognition.stop();
    }
}

function uploadToS3(transcript) {
    const fileName = `transcriptions/${Date.now()}.txt`;
    const params = {
        Bucket: 'web-conversation-transcriptions', // Remplacez par le nom de votre bucket
        Key: fileName,
        Body: transcript,
        ContentType: 'text/plain'
    };

    s3.upload(params, (error, data) => {
        if (error) {
            console.error('Erreur de téléversement:', error);
            statusLabel.textContent = 'Erreur de téléversement. Veuillez réessayer.';
        } else {
            console.log('Téléversement réussi:', data);
            statusLabel.textContent = 'Téléversement réussi !';
        }
    });
}
