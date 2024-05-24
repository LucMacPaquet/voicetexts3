// Configurer AWS
AWS.config.update({
    region: 'us-east-1', // Remplacez par la région de votre bucket
    credentials: new AWS.Credentials('YOUR_ACCESS_KEY', 'YOUR_SECRET_KEY')
});

const s3 = new AWS.S3();

const recordButton = document.getElementById('recordButton');
const statusLabel = document.getElementById('statusLabel');

let mediaRecorder;
let audioChunks = [];

recordButton.addEventListener('click', () => {
    if (recordButton.textContent === 'Enregistrer') {
        startRecording();
    } else {
        stopRecording();
    }
});

function startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('L\'enregistrement audio n\'est pas supporté sur ce navigateur.');
        return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.start();

        mediaRecorder.addEventListener('dataavailable', event => {
            audioChunks.push(event.data);
        });

        mediaRecorder.addEventListener('stop', () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
            uploadToS3(audioBlob);
            audioChunks = [];
        });

        recordButton.textContent = 'Arrêter';
        statusLabel.textContent = 'Enregistrement en cours...';
    }).catch(error => {
        console.error('Erreur d\'accès au microphone:', error);
        alert('Erreur d\'accès au microphone. Veuillez vérifier les permissions.');
    });
}

function stopRecording() {
    mediaRecorder.stop();
    recordButton.textContent = 'Enregistrer';
    statusLabel.textContent = 'Enregistrement terminé. Téléversement en cours...';
}

function uploadToS3(audioBlob) {
    const fileName = `audio/${Date.now()}.mp3`;
    const params = {
        Bucket: 'arqialuc', // Remplacez par le nom de votre bucket
        Key: fileName,
        Body: audioBlob,
        ContentType: 'audio/mpeg'
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
