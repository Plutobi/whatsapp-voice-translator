require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const Anthropic = require('@anthropic-ai/sdk');
const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const groq      = new Groq({ apiKey: process.env.GROQ_API_KEY });

const LANGUAGES = {
    '1': { name: 'English',   code: 'en', flag: '🇬🇧' },
    '2': { name: 'German',    code: 'de', flag: '🇩🇪' },
    '3': { name: 'French',    code: 'fr', flag: '🇫🇷' },
    '4': { name: 'Arabic',    code: 'ar', flag: '🇸🇦' },
    '5': { name: 'Ukrainian', code: 'uk', flag: '🇺🇦' },
};

const LANG_FLAGS = {
    en: '🇬🇧', de: '🇩🇪', fr: '🇫🇷',
    ar: '🇸🇦', uk: '🇺🇦', es: '🇪🇸',
    pt: '🇵🇹', zh: '🇨🇳', tr: '🇹🇷'
};

// Store pending transcriptions per contact
const pending = {};
// Track welcomed contacts
const welcomed = {};

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', qr => {
    qrcode.toFile('./qrcode.png', qr, err => {
        if (!err) console.log('📱 QR saved! Open qrcode.png and scan it');
    });
});

client.on('ready', () => {
    console.log('✅ Connected! Listening for voice notes...');
});

client.on('message', async (msg) => {
    if (msg.from === 'status@broadcast') return;

    const contact = msg.from;

    // Handle language selection reply
    if (pending[contact] && LANGUAGES[msg.body.trim()]) {
        const choice = msg.body.trim();
        const targetLang = LANGUAGES[choice];
        const { transcription } = pending[contact];

        try {
            const translation = await translateWithClaude(transcription, targetLang.code);

            let reply = '';
            reply += '━━━━━━━━━━━━━━━━━━\n';
            reply += targetLang.flag + ' *' + targetLang.name + ' Translation*\n';
            reply += '━━━━━━━━━━━━━━━━━━\n\n';
            reply += translation;
            reply += '\n\n' + buildMenu();

            await msg.reply(reply);
            console.log('✅ Translation sent to ' + contact);

        } catch (err) {
            console.error('❌ Translation error: ' + err.message);
            await msg.reply('❌ Sorry, translation failed. Please try again.');
        }
        return;
    }

    // Handle voice notes
    if (msg.type !== 'ptt' && msg.type !== 'audio') {
        if (!welcomed[contact]) {
            welcomed[contact] = true;
            await msg.reply(buildWelcome());
        }
        return;
    }

    console.log('🎙️ Voice note received from ' + contact);

    try {
        const media = await msg.downloadMedia();
        const audioBuffer = Buffer.from(media.data, 'base64');
        const tmpInput = path.join(__dirname, 'tmp_input.ogg');
        fs.writeFileSync(tmpInput, audioBuffer);

        await msg.reply('🎙️ _Voice note received! Processing..._');

        console.log('⏳ Transcribing...');
        const transcription = await transcribeAudio(tmpInput);
        console.log('📝 Original: ' + transcription);

        const detectedLang = await detectLanguage(transcription);
        const detectedFlag = LANG_FLAGS[detectedLang] || '🌍';
        console.log('🔍 Detected language: ' + detectedLang);

        pending[contact] = { transcription, detectedLang };

        let reply = '';
        reply += '━━━━━━━━━━━━━━━━━━\n';
        reply += detectedFlag + ' *Original (' + detectedLang.toUpperCase() + ')*\n';
        reply += '━━━━━━━━━━━━━━━━━━\n\n';
        reply += transcription;
        reply += '\n\n' + buildMenu();

        await msg.reply(reply);
        fs.unlinkSync(tmpInput);

    } catch (err) {
        console.error('❌ Error: ' + err.message);
        await msg.reply('❌ Sorry, could not process that voice note. Please try again.');
    }
});

function buildWelcome() {
    let msg = '👋 *Welcome to VoiceTranslator Bot!*\n';
    msg += '━━━━━━━━━━━━━━━━━━\n\n';
    msg += '🎙️ Send me a *voice note* in any language and I will:\n\n';
    msg += '  1️⃣  Transcribe what you said\n';
    msg += '  2️⃣  Detect your language automatically\n';
    msg += '  3️⃣  Let you pick a translation language\n\n';
    msg += '🌍 *Supported languages:*\n';
    msg += '🇬🇧 English  🇩🇪 German  🇫🇷 French\n';
    msg += '🇸🇦 Arabic  🇺🇦 Ukrainian\n\n';
    msg += '_Just send a voice note to get started!_ 🚀';
    return msg;
}

function buildMenu() {
    let menu = '🌐 *Translate to:*\n';
    menu += '─────────────────\n';
    for (const [num, lang] of Object.entries(LANGUAGES)) {
        menu += num + '. ' + lang.flag + '  ' + lang.name + '\n';
    }
    menu += '─────────────────\n';
    menu += '_Reply with a number to translate_';
    return menu;
}

async function transcribeAudio(filePath) {
    const transcription = await groq.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: 'whisper-large-v3',
        response_format: 'text',
    });
    return transcription;
}

async function detectLanguage(text) {
    const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 10,
        system: 'You are a language detector. Reply only with the 2-letter ISO language code in lowercase. Nothing else. No punctuation.',
        messages: [{ role: 'user', content: 'Detect the language: ' + text }]
    });
    return message.content[0].text.trim().toLowerCase();
}

async function translateWithClaude(text, targetLangCode) {
    const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: 'You are a translator. Reply only with the translated text, nothing else. No explanations, no notes.',
        messages: [{
            role: 'user',
            content: 'Translate the following text to ' + targetLangCode + ':\n\n' + text
        }]
    });
    return message.content[0].text.trim();
}

client.initialize();