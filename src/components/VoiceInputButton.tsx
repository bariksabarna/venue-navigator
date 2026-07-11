/**
 * VoiceInputButton Component
 *
 * Provides a microphone button that activates the browser's Web Speech API
 * for voice input. Recognized speech is passed to the onTranscript callback.
 * When the accessibility profile is deaf_hoh, this button is hidden because
 * voice is not the preferred modality for that profile.
 *
 * Handles: SpeechRecognition availability check, start/stop toggle,
 * interim results display, and error states.
 *
 * @component
 * @param {Function} props.onTranscript  - Called with the final transcript string.
 * @param {boolean}  props.disabled      - Whether the button should be disabled.
 * @param {boolean}  props.isDeafProfile - When true, hides this button entirely.
 */

import { useState, useRef, useCallback } from 'react';

// TypeScript interfaces for Web Speech API
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: () => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

interface WindowSpeech extends Window {
  SpeechRecognition?: new () => SpeechRecognition;
  webkitSpeechRecognition?: new () => SpeechRecognition;
}

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  isDeafProfile?: boolean;
}

/** Gets the cross-browser SpeechRecognition constructor or null */
function getSpeechRecognition(): (new () => SpeechRecognition) | null {
  const win = window as unknown as WindowSpeech;
  if (win.SpeechRecognition) return win.SpeechRecognition;
  if (win.webkitSpeechRecognition) return win.webkitSpeechRecognition;
  return null;
}

/**
 * VoiceInputButton renders a microphone toggle that drives Web Speech API recognition.
 */
export function VoiceInputButton({ onTranscript, disabled = false, isDeafProfile = false }: VoiceInputButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [interim, setInterim] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const SpeechRecognitionClass = getSpeechRecognition();

  const startListening = useCallback(() => {
    if (!SpeechRecognitionClass) return;
    const rec = new SpeechRecognitionClass();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'und'; // Undetermined — lets the browser auto-detect language

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interimText = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interimText += result[0].transcript;
      }
      setInterim(interimText);
      if (finalText) {
        onTranscript(finalText.trim());
        setInterim('');
      }
    };

    rec.onerror = () => {
      setIsListening(false);
      setInterim('');
    };

    rec.onend = () => {
      setIsListening(false);
      setInterim('');
    };

    rec.start();
    recognitionRef.current = rec;
    setIsListening(true);
  }, [SpeechRecognitionClass, onTranscript]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterim('');
  }, []);

  // Hide entirely when using deaf/HoH profile
  if (isDeafProfile || !SpeechRecognitionClass) return null;

  return (
    <>
      <button
        type="button"
        className={`voice-btn${isListening ? ' listening' : ''}`}
        onClick={isListening ? stopListening : startListening}
        disabled={disabled}
        aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
        aria-pressed={isListening}
        title={isListening ? 'Stop listening' : 'Speak your question'}
      >
        <span aria-hidden="true">{isListening ? '🔴' : '🎤'}</span>
      </button>
      {interim && (
        <div aria-live="polite" className="visually-hidden">
          Interim transcript: {interim}
        </div>
      )}
    </>
  );
}
